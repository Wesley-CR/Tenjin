import { describe, expect, it } from "vitest";
import {
  scoreStrokesAgainstGlyph,
  strokesToMask,
  type Stroke,
} from "@/lib/recognition";

const W = 128, H = 128;

// A "glyph" that occupies a box and a helper for user ink.
function boxMask(x0: number, y0: number, x1: number, y1: number) {
  const m = new Uint8Array(W * H);
  for (let y = Math.floor(y0 * H); y < y1 * H; y++)
    for (let x = Math.floor(x0 * W); x < x1 * W; x++) m[y * W + x] = 255;
  return m;
}

const boxStroke = (x0: number, y0: number, x1: number, y1: number): Stroke[] => [
  [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ],
];

describe("draw recognition", () => {
  it("matches a faithful drawing on the target area (pass)", () => {
    const target = boxMask(0.3, 0.3, 0.7, 0.7);
    const user = boxStroke(0.3, 0.3, 0.7, 0.7);
    const res = scoreStrokesAgainstGlyph(user, target, W, H);
    expect(res.pass).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(0.5);
  });

  it("forgives small positional slop (dilation)", () => {
    const target = boxMask(0.3, 0.3, 0.7, 0.7);
    const user = boxStroke(0.33, 0.33, 0.67, 0.67);
    const res = scoreStrokesAgainstGlyph(user, target, W, H);
    expect(res.pass).toBe(true);
  });

  it("rejects an empty canvas", () => {
    const target = boxMask(0.3, 0.3, 0.7, 0.7);
    const res = scoreStrokesAgainstGlyph([], target, W, H);
    expect(res.pass).toBe(false);
    expect(res.score).toBe(0);
  });

  it("rejects a drawing nowhere near the glyph", () => {
    const target = boxMask(0.1, 0.1, 0.25, 0.25);
    const user = boxStroke(0.7, 0.7, 0.95, 0.95);
    const res = scoreStrokesAgainstGlyph(user, target, W, H);
    expect(res.pass).toBe(false);
  });

  it("strokesToMask writes ink only where strokes run", () => {
    const mask = strokesToMask([[
      { x: 0.2, y: 0.5 },
      { x: 0.8, y: 0.5 },
    ]], W, H, 0.05);
    const hit = (x: number, y: number) =>
      mask[y * W + x] > 0;
    expect(hit(Math.floor(0.2 * W), Math.floor(0.5 * H))).toBe(true);
    expect(hit(Math.floor(0.8 * W), Math.floor(0.5 * H))).toBe(true);
    expect(hit(Math.floor(0.95 * W), Math.floor(0.1 * H))).toBe(false);
  });
});
