"use client";

/**
 * Lightweight cursor-reactive grid for the login brand panel.
 * Canvas 2D (no WebGL) so a graphics failure cannot blank the panel.
 * Visual language inspired by React Bits Cursor Grid:
 * https://reactbits.dev/animations/cursor-grid
 */
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/components/lib/utils";

const PRIMARY = { r: 54, g: 81, b: 245 }; // #3651f5

type CursorGridProps = {
  className?: string;
  cellSize?: number;
  radius?: number;
};

export function CursorGrid({
  className,
  cellSize = 36,
  radius = 160,
}: CursorGridProps) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const pointer = { x: -1e9, y: -1e9, inside: false };
    const pulses: Array<{ x: number; y: number; t0: number }> = [];
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let levels: Float32Array = new Float32Array(0);
    let clock = 0;
    let last = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / cellSize) + 1;
      rows = Math.ceil(h / cellSize) + 1;
      levels = new Float32Array(cols * rows);
    };

    const energize = (x: number, y: number, strength = 1) => {
      const r2 = radius * radius;
      const minC = Math.max(0, Math.floor((x - radius) / cellSize));
      const maxC = Math.min(cols - 1, Math.floor((x + radius) / cellSize));
      const minR = Math.max(0, Math.floor((y - radius) / cellSize));
      const maxR = Math.min(rows - 1, Math.floor((y + radius) / cellSize));
      for (let row = minR; row <= maxR; row++) {
        for (let col = minC; col <= maxC; col++) {
          const cx = col * cellSize + cellSize / 2;
          const cy = row * cellSize + cellSize / 2;
          const d2 = (cx - x) * (cx - x) + (cy - y) * (cy - y);
          if (d2 > r2) continue;
          const t = 1 - Math.sqrt(d2) / radius;
          const v = t * t * (3 - 2 * t) * strength;
          const i = row * cols + col;
          if (v > levels[i]) levels[i] = v;
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Base grid lines (TraceFence tech-grid feel)
      ctx.strokeStyle = `rgba(${PRIMARY.r},${PRIMARY.g},${PRIMARY.b},0.11)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += cellSize) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = 0; y <= h; y += cellSize) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();

      // Lit cells
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const v = levels[row * cols + col];
          if (v < 0.02) continue;
          const x = col * cellSize;
          const y = row * cellSize;
          ctx.fillStyle = `rgba(${PRIMARY.r},${PRIMARY.g},${PRIMARY.b},${0.06 + v * 0.22})`;
          ctx.fillRect(x + 1, y + 1, cellSize - 1, cellSize - 1);
          ctx.strokeStyle = `rgba(${PRIMARY.r},${PRIMARY.g},${PRIMARY.b},${0.2 + v * 0.55})`;
          ctx.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);
        }
      }

      // Soft spotlight near cursor
      if (pointer.inside) {
        const g = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          radius,
        );
        g.addColorStop(0, `rgba(${PRIMARY.r},${PRIMARY.g},${PRIMARY.b},0.12)`);
        g.addColorStop(1, `rgba(${PRIMARY.r},${PRIMARY.g},${PRIMARY.b},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(pointer.x - radius, pointer.y - radius, radius * 2, radius * 2);
      }
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      clock += dt;

      // Decay lit cells
      for (let i = 0; i < levels.length; i++) {
        if (levels[i] > 0) levels[i] = Math.max(0, levels[i] - dt * 1.35);
      }

      if (pointer.inside) energize(pointer.x, pointer.y, 1);

      // Click ripples
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k];
        const age = clock - p.t0;
        if (age > 0.9) {
          pulses.splice(k, 1);
          continue;
        }
        const ring = age * 420;
        const strength = (1 - age / 0.9) * 0.85;
        const minC = Math.max(0, Math.floor((p.x - ring - 40) / cellSize));
        const maxC = Math.min(cols - 1, Math.floor((p.x + ring + 40) / cellSize));
        const minR = Math.max(0, Math.floor((p.y - ring - 40) / cellSize));
        const maxR = Math.min(rows - 1, Math.floor((p.y + ring + 40) / cellSize));
        for (let row = minR; row <= maxR; row++) {
          for (let col = minC; col <= maxC; col++) {
            const cx = col * cellSize + cellSize / 2;
            const cy = row * cellSize + cellSize / 2;
            const dist = Math.hypot(cx - p.x, cy - p.y);
            const band = Math.abs(dist - ring);
            if (band > 28) continue;
            const v = strength * Math.exp(-(band * band) / 220);
            const i = row * cols + col;
            if (v > levels[i]) levels[i] = v;
          }
        }
      }

      draw();
      raf = requestAnimationFrame(frame);
    };

    const locate = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return {
        x,
        y,
        inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height,
      };
    };

    const onMove = (e: PointerEvent) => {
      const { x, y, inside } = locate(e);
      pointer.inside = inside;
      if (!inside) return;
      pointer.x = x;
      pointer.y = y;
    };

    const onDown = (e: PointerEvent) => {
      const { x, y, inside } = locate(e);
      if (!inside) return;
      pulses.push({ x, y, t0: clock });
    };

    const onLeave = () => {
      pointer.inside = false;
    };

    resize();
    // Intro pulse so the grid is obviously alive on load
    pulses.push({ x: w * 0.35, y: h * 0.4, t0: 0 });
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce, cellSize, radius]);

  if (reduce) return null;

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block size-full" />
    </div>
  );
}

export default CursorGrid;
