/**
 * Handwriting similarity for the draw drill.
 *
 * The trick that makes this dependency-free: we don't try to *classify* an
 * arbitrary drawing. The expected answer is known, so we compare the user's
 * ink against the target glyph rendered with the same font, in the same box.
 * A combination of "how much of my ink matches the glyph" (precision) and
 * "how much of the glyph did I cover" (recall) decides.
 *
 * Everything here is pure and DOM-free (operates on Uint8Arrays), so the
 * scoring logic is unit-testable. The canvas sampling lives in the component.
 */

export interface Point {
  x: number;
  y: number;
}

export type Stroke = Point[];

const THRESHOLD = 118; // alpha above this counts as "ink"

export function alphaFromMask(mask: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i] > THRESHOLD) n++;
  return n;
}

/**
 * Rasterises stroke polylines (coordinates 0..1) into a W×H alpha mask.
 * Stroke width is given in the same 0..1 space.
 */
export function strokesToMask(
  strokes: Stroke[],
  w: number,
  h: number,
  strokeWidth = 0.035
): Uint8Array {
  const mask = new Uint8Array(w * h);
  const half = (strokeWidth * Math.max(w, h)) / 2;

  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    if (stroke.length === 1) {
      paintDot(mask, w, h, stroke[0].x * w, stroke[0].y * h, half);
      continue;
    }
    for (let i = 0; i < stroke.length - 1; i++) {
      paintSeg(mask, w, h, stroke[i], stroke[i + 1], half);
    }
  }
  return mask;
}

function paintSeg(
  mask: Uint8Array,
  w: number,
  h: number,
  a: Point,
  b: Point,
  half: number
) {
  const ax = a.x * w, ay = a.y * h, bx = b.x * w, by = b.y * h;
  const len = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(len));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    paintDot(mask, w, h, ax + (bx - ax) * t, ay + (by - ay) * t, half);
  }
}

function paintDot(
  mask: Uint8Array,
  w: number,
  h: number,
  cx: number,
  cy: number,
  radius: number
) {
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(w - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(h - 1, Math.ceil(cy + radius));
  const r2 = radius * radius;
  // Conservative: otherwise requires Math object for clarity.
  const n = Math.max(1, Math.floor(radius));
  for (let y = minY; y <= maxY; y++) {
    const dy = y - cy;
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      if (dx * dx + dy * dy <= r2) mask[y * w + x] = 255;
      else if (dx * dx + dy * dy <= (radius + n) * (radius + n)) {
        // cheap 2-step feather edge
        mask[y * w + x] = Math.max(mask[y * w + x], 150);
      }
    }
  }
}

/** Dilates an alpha mask by `radius` px — forgives small positional slop. */
export function dilate(mask: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const center = y * w + x;
      if (mask[center] > THRESHOLD) {
        const y0 = Math.max(0, y - radius), y1 = Math.min(h - 1, y + radius);
        const x0 = Math.max(0, x - radius), x1 = Math.min(w - 1, x + radius);
        for (let yy = y0; yy <= y1; yy++) {
          for (let xx = x0; xx <= x1; xx++) {
            out[yy * w + xx] = 255;
          }
        }
      }
    }
  }
  return out;
}

export interface MatchScore {
  precision: number;
  recall: number;
  score: number;
  pass: boolean;
}

export const DRAW_PASS_THRESHOLD = 0.45;

/**
 * Compares two equal-size masks (user ink vs target glyph).
 * `precision` = fraction of user ink covered by the (dilated) glyph,
 * `recall` = fraction of the glyph covered by (dilated) user ink.
 * A weighted combo must clear the threshold for a pass.
 */
export function scoreStrokesAgainstGlyph(
  userStrokes: Stroke[],
  glyphMask: Uint8Array,
  w: number,
  h: number,
  strokeWidth = 0.035,
  threshold = DRAW_PASS_THRESHOLD
): MatchScore {
  if (userStrokes.length === 0) return { precision: 0, recall: 0, score: 0, pass: false };

  const user = dilate(strokesToMask(userStrokes, w, h, strokeWidth), w, h, 2);
  const glyph = dilate(glyphMask, w, h, 2);
  const userInk = inkArea(user);
  const glyphInk = inkArea(glyph);
  const overlap = overlapArea(user, glyph);

  const precision = userInk > 0 ? overlap / userInk : 0;
  const recall = glyphInk > 0 ? overlap / glyphInk : 0;
  const score = 0.6 * precision + 0.4 * recall;
  return { precision, recall, score, pass: score >= threshold };
}

/** Ink area, normalised to image size. */
export function inkArea(mask: Uint8Array): number {
  return alphaFromMask(mask) / mask.length;
}

/** Overlap area of two masks, normalised. */
export function overlapArea(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) throw new Error("mask size mismatch");
  let n = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] > THRESHOLD && b[i] > THRESHOLD) n++;
  }
  return n / a.length;
}

/* --------------------------- browser helpers --------------------------- */

/** Renders a glyph into a W×H alpha mask using the provided 2D context + font. */
export function glyphTextToMask(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
  font: string
): Uint8Array {
  const c = ctx.canvas;
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  ctx.clearRect(0, 0, w, h);
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  // Slight optical adjustment is baked in so kana sit centered.
  ctx.fillText(text, w / 2, h / 2 + h * 0.02);
  const data = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3];
  return mask;
}
