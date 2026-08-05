"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  scoreStrokesAgainstGlyph,
  glyphTextToMask,
  type Stroke,
} from "@/lib/recognition";

const RECOGNIZE_DELAY = 350; // ms idle after last stroke before auto-check
const MASK = 160;

interface Props {
  target: string; // the expected kana character
  fontFamily: string;
  onPass: () => void;
  onFail: () => void;
}

/**
 * Canvas for the draw drill. Ink is stored as normalised strokes; after a
 * short idle the strokes are checked against the target glyph and the result
 * is reported up. A faint trace overlay helps beginners (toggleable).
 */
export function DrawCanvas({ target, fontFamily, onPass, onFail }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = (canvas.width = 512);
    const h = (canvas.height = 512);

    ctx.clearRect(0, 0, w, h);

    if (showTrace) {
      ctx.globalAlpha = 0.16;
      ctx.font = `380px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "currentColor";
      ctx.fillText(target, w / 2, h / 2 + h * 0.01);
      ctx.globalAlpha = 1;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;
      ctx.strokeStyle = "currentColor";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * w, stroke[0].y * h);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * w, stroke[i].y * h);
      }
      ctx.stroke();
    }
  }, [showTrace, fontFamily, target]);

  useEffect(() => {
    redraw();
  }, [redraw, target]);

  const clear = useCallback(() => {
    strokesRef.current = [];
    if (timerRef.current) clearTimeout(timerRef.current);
    redraw();
  }, [redraw]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const recognize = useCallback(() => {
    const strokes = strokesRef.current;
    if (strokes.length === 0) return;
    const temp = document.createElement("canvas");
    temp.width = MASK;
    temp.height = MASK;
    const ctx = temp.getContext("2d");
    if (!ctx) return;
    const glyphMask = glyphTextToMask(ctx, target, MASK, MASK, `104px ${fontFamily}`);
    const res = scoreStrokesAgainstGlyph(strokes, glyphMask, MASK, MASK);
    if (res.pass) {
      setFlash("ok");
      onPass();
      setTimeout(() => {
        clear();
        setFlash("ok");
      }, 260);
    } else {
      setFlash("no");
      onFail();
      setTimeout(() => setFlash(null), 500);
    }
  }, [target, fontFamily, onPass, onFail, clear]);

  const scheduleCheck = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(recognize, RECOGNIZE_DELAY);
  }, [recognize]);

  function toLocal(e: React.PointerEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([toLocal(e)]);
    redraw();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    const strokes = strokesRef.current;
    strokes[strokes.length - 1].push(toLocal(e));
    redraw();
  }

  function onPointerUp() {
    drawingRef.current = false;
    scheduleCheck();
  }

  return (
    <div className={`draw-area ${flash ? `draw-area--${flash}` : ""}`}>
      <canvas
        ref={canvasRef}
        className="draw-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "none" }}
      />
      <div className="draw-tools">
        <button type="button" className="btn-ghost" onClick={clear}>
          Clear
        </button>
        <button
          type="button"
          className={`btn-ghost ${showTrace ? "is-active" : ""}`}
          onClick={() => setShowTrace((v) => !v)}
        >
          {showTrace ? "Hide guide" : "Show guide"}
        </button>
      </div>
    </div>
  );
}
