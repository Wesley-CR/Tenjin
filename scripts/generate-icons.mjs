// Generates app icons (pure Node, no deps). Usage: npm run icons
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

/* ---- minimal PNG encoder (RGBA8) ---- */
const T = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc = (b) => {
  let c = -1;
  for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, "ascii");
  const cb = Buffer.alloc(4);
  cb.writeUInt32BE(crc(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, cb]);
};
function png(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  const src = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    src.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---- renderer: minimal あ mark on an accent square ---- */
const A = [217, 76, 42], B = [170, 52, 24], INK = [255, 250, 247];
const SU = 3;

// distance from point to segment ab (px)
function segDist(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1)));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}
function render(size, shape) {
  const S = size * SU;
  const px = new Uint8Array(S * S * 4);
  const R = S / 2, rad = S * 0.5, corner = S * 0.19;
  const strokes = [
    strip(0.30, 0.34, 0.70, 0.34, 0.021), // top bar
    strip(0.45, 0.34, 0.37, 0.66, 0.022), // diagonal
    strip(0.37, 0.66, 0.32, 0.80, 0.018), // tail
  ];
  const loop = { cx: 0.63, cy: 0.68, r: 0.15, w: 0.16 };

  function strip(x1, y1, x2, y2, w) {
    return { ax: x1 * S, ay: y1 * S, bx: x2 * S, by: y2 * S, half: (w * S) / 2 };
  }

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      // rounded-rect signed distance
      const qx = Math.abs(x - R) - (rad - corner), qy = Math.abs(y - R) - (rad - corner);
      const dx = Math.max(qx, 0), dy = Math.max(qy, 0);
      const dist = Math.hypot(dx, dy) + Math.min(Math.max(qx, qy), 0) - corner + rad - R;
      const inside = shape === "square" ? 1 : Math.max(0, Math.min(1, 0.5 - dist));
      if (inside <= 0) continue;

      // vertical gradient background
      const g = y / S;
      const r = A[0] + (B[0] - A[0]) * g;
      const gg = A[1] + (B[1] - A[1]) * g;
      const b = A[2] + (B[2] - A[2]) * g;
      let a = inside;

      // ink alpha accumulation (additive)
      let ink = 0;
      for (const s of strokes) {
        const d = segDist(x, y, s.ax, s.ay, s.bx, s.by);
        ink = Math.max(ink, Math.max(0, Math.min(1, (s.half + 0.5 - d))));
      }
      const lc = Math.hypot(x - loop.cx * S, y - loop.cy * S);
      const rd = Math.abs(lc - loop.r * S);
      ink = Math.max(ink, Math.max(0, Math.min(1, (loop.w * S) / 2 - rd)));
      // punch a hole in the loop centre so it reads as a ring
      const hole = Math.hypot(x - loop.cx * S, y - loop.cy * S);
      if (hole < loop.r * S * 0.58) ink = 0;

      px[i] = r * (1 - ink) + INK[0] * ink;
      px[i + 1] = gg * (1 - ink) + INK[1] * ink;
      px[i + 2] = b * (1 - ink) + INK[2] * ink;
      px[i + 3] = Math.round(a * 255);
    }
  }
  return downsample(px, S, size);
}

function downsample(src, S, size) {
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SU; sy++)
        for (let sx = 0; sx < SU; sx++) {
          const i = ((y * SU + sy) * S + (x * SU + sx)) * 4;
          r += src[i]; g += src[i + 1]; b += src[i + 2]; a += src[i + 3];
        }
      const n = SU * SU, i = (y * size + x) * 4;
      out[i] = r / n; out[i + 1] = g / n; out[i + 2] = b / n; out[i + 3] = a / n;
    }
  }
  return out;
}

writeFileSync(join(OUT, "icon-192.png"), png(192, 192, render(192, "rounded")));
writeFileSync(join(OUT, "icon-512.png"), png(512, 512, render(512, "rounded")));
writeFileSync(join(OUT, "icon-maskable-512.png"), png(512, 512, render(512, "square")));
writeFileSync(join(OUT, "apple-touch-icon.png"), png(180, 180, render(180, "square")));
console.log("icons written to public/");
