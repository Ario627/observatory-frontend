"use client"

import { useEffect, useRef } from "react"
import { useReduceMotion } from "@/hooks/useReduceMotion"
import { cn } from "@/lib/cn"
import { azAltToDial, deg2rad, shortestAzDelta } from "@/lib/coordinates"
import type { SkySnapshot } from "@/types/celestial"

const TWEEN_MS = 700;
const DPR_LIMIT = 2;
const TAU = Math.PI * 2;
const DIAL_RADIUS_SHARE = 0.7;
const CARDINAL_OFFSET_PX = 15;
const LABEL_OFFSET_PX = 10;

const RING_INK = "rgba(255, 255, 255, 0.08)";
const RING_SOFT_INK = "rgba(255, 255, 255, 0.05)";
const CARDINAL_INK = "rgba(143, 160, 184, 0.85)";
const ZENITH_INK = "rgba(255, 255, 255, 0.18)";
const ABOVE_INK = "#6FE5DA";
const BELOW_INK = "rgba(143, 160, 184, 0.5)";
const ACTIVE_INK = "#A2FFF5";
const ACTIVE_HALO = "rgba(111, 229, 218, 0.55)";
const LABEL_INK = "rgba(223, 226, 236, 0.92)";


const CARDINALS = [
  { key: "U", az: 0 },
  { key: "T", az: 90 },
  { key: "S", az: 180 },
  { key: "B", az: 270 },
] as const;

type Motion = { az: number; alt: number };

export type SkyDialProps = {
  snapshots: readonly SkySnapshot[];
  selectedId: string | null;
  selectedLabel: string | null;
  className?: string;
};

export function SkyDial({
    snapshots,
    selectedId,
    selectedLabel,
    className,
}: SkyDialProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const displayRef = useRef(new Map<string, Motion>());
    const drawRef = useRef<(() => void) | null>(null);
    const selectionRef = useRef({ id: selectedId, label: selectedLabel });
    const familyRef = useRef<string | null>(null);
    const reduced = useReduceMotion();

    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas === null) return;

        const context = canvas.getContext("2d");

        if (context === null) return;

        const paint = (): void => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            if (width === 0 || height === 0) return;

            const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
            const backingWidth = Math.round(width * dpr);
            const backingHeight = Math.round(height * dpr);

            if (canvas.width !== backingWidth) canvas.width = backingWidth;
            if (canvas.height !== backingHeight) canvas.height = backingHeight;

            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            context.clearRect(0, 0, width, height);

            familyRef.current ??= getComputedStyle(canvas).fontFamily;

            const family = familyRef.current;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = (Math.min(width, height) / 2) * DIAL_RADIUS_SHARE;

            context.lineWidth = 1;

            context.strokeStyle = RING_INK;
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, TAU);
            context.stroke();

            context.strokeStyle = RING_SOFT_INK;
            context.setLineDash([2, 5]);
            context.beginPath();
            context.arc(centerX, centerY, radius * Math.cos(Math.PI / 4), 0, TAU);
            context.stroke();
            context.setLineDash([]);

            context.fillStyle = ZENITH_INK;
            context.beginPath();
            context.arc(centerX, centerY, 1.2, 0, TAU);
            context.fill();

            context.font = `600 10px ${family}`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = CARDINAL_INK;

            for (const cardinal of CARDINALS) {
                const angle = deg2rad(cardinal.az);

                context.fillText(
                cardinal.key,
                centerX + Math.sin(angle) * (radius + CARDINAL_OFFSET_PX),
                centerY - Math.cos(angle) * (radius + CARDINAL_OFFSET_PX),
                );
            }

            const selection = selectionRef.current;
            let activeX = 0;
            let activeY = 0;
            let hasActive = false;

            for (const snapshot of snapshots) {
                const motion = displayRef.current.get(snapshot.id) ?? {
                az: snapshot.az,
                alt: snapshot.alt,
                };
                const point = azAltToDial(motion.az, motion.alt);
                const x = centerX + point.x * radius;
                const y = centerY - point.y * radius;

                if (snapshot.id === selection.id) {
                activeX = x;
                activeY = y;
                hasActive = true;
                continue;
                }

                context.fillStyle = point.belowHorizon ? BELOW_INK : ABOVE_INK;
                context.beginPath();
                context.arc(x, y, point.belowHorizon ? 2.2 : 2.6, 0, TAU);
                context.fill();
            }

            if (!hasActive) return;

            context.fillStyle = ACTIVE_INK;
            context.beginPath();
            context.arc(activeX, activeY, 3.4, 0, TAU);
            context.fill();

            context.strokeStyle = ACTIVE_HALO;
            context.beginPath();
            context.arc(activeX, activeY, 8, 0, TAU);
            context.stroke();

            if (selection.label === null) return;

            const flip = activeX > centerX;
            const above = activeY > centerY - radius * 0.7;

            context.font = `600 9px ${family}`;
            context.fillStyle = LABEL_INK;
            context.textAlign = flip ? "right" : "left";
            context.fillText(
                selection.label,
                activeX + (flip ? -LABEL_OFFSET_PX : LABEL_OFFSET_PX),
                activeY + (above ? -LABEL_OFFSET_PX : LABEL_OFFSET_PX + 6),
            );
        }

        drawRef.current = paint;

        const targets = new Map<string, Motion>();

        for(const snapshot of snapshots) {
            targets.set(snapshot.id, {az: snapshot.az, alt: snapshot.alt});
        }

        for (const id of [...displayRef.current.keys()]) {
      if (!targets.has(id)) displayRef.current.delete(id);
    }

    if (reduced) {
      displayRef.current = new Map(targets);
      paint();

      return () => {
        if (drawRef.current === paint) drawRef.current = null;
      };
    }

    const from = new Map(displayRef.current);

    for (const [id, motion] of targets) {
      if (!from.has(id)) from.set(id, motion);
    }

    const startedAt = performance.now();
    let frame = 0;

    const step = (now: number): void => {
      const progress = Math.min((now - startedAt) / TWEEN_MS, 1);
      const eased = 1 - (1 - progress) ** 3;

      for (const [id, target] of targets) {
        const start = from.get(id) ?? target;

        displayRef.current.set(id, {
          az: start.az + shortestAzDelta(start.az, target.az) * eased,
          alt: start.alt + (target.alt - start.alt) * eased,
        });
      }

      paint();

      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);

      if (drawRef.current === paint) drawRef.current = null;
    };
  }, [snapshots, reduced]);

  useEffect(() => {
    selectionRef.current = { id: selectedId, label: selectedLabel };
    drawRef.current?.();
  }, [selectedId, selectedLabel]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas === null) return;

    const observer = new ResizeObserver(() => drawRef.current?.());

    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  const above = snapshots.filter((snapshot) => snapshot.visible).length;
  const ariaLabel = `Dial langit: ${above} objek di atas horizon, ${snapshots.length - above} di bawah horizon`;

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={ariaLabel}
      className={cn("block aspect-square w-full font-mono-data", className)}
    />
  );
}