"use client"

import { useEffect, useRef } from "react";
import { useReduceMotion } from "@/hooks/useReduceMotion";

const PARALLAX_FACTOR = 0.3;
const DPR_LIMIT = 2;
const AREA_PER_STAR = 14_000;
const STAR_FLOOR = 80;
const STAR_CEILING = 420;
const TAU = Math.PI * 2;
const SEED = 0x414d4249;

const TONES = [
  "rgba(223, 226, 236, 1)",
  "rgba(223, 226, 236, 1)",
  "rgba(223, 226, 236, 1)",
  "rgba(188, 201, 199, 1)",
  "rgba(91, 139, 247, 1)",
];


function createRandom(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state * 0x6d2b79f5) >>> 0;

        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value  ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
    
    }
}


function paint(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext("2d");
    const width = canvas.clientWidth;

    const height = canvas.clientHeight;

    if (context === null || width === 0 || height === 0) return;



    const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
    const pixelsWide = Math.round(width * dpr);
    const pixelsTall = Math.round(height * dpr);


    if (canvas.width !== pixelsWide) canvas.width = pixelsWide;
    if (canvas.height !== pixelsTall) canvas.height = pixelsTall;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const random = createRandom(SEED);
    const total = Math.min(Math.round((width * height) / AREA_PER_STAR), STAR_FLOOR, STAR_CEILING)

    for (let i = 0; i < total; i++) {
        const depth = random();
        const radius = 0.35 + depth * depth * 1.1;

        context.globalAlpha = 0.16 + depth * 0.62;
        context.fillStyle = TONES[Math.floor(random() * TONES.length)];
        context.beginPath();
        context.arc(random() * width, random() * height, radius, 0, TAU);
        context.fill();
    }

    context.globalAlpha = 1;
}


export function StarfieldBackdrop() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReduceMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (canvas === null || container === null) return;

    let frame = 0;

    const draw = (): void => {
      frame = 0;
      paint(canvas);
    };

    const schedule = (): void => {
      if (frame !== 0) return;

      frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(schedule);

    observer.observe(container);
    schedule();

    return () => {
      observer.disconnect();

      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas === null) return;

    if (reduced) {
      canvas.style.transform = "";
      return;
    }

    let frame = 0;

    const apply = (): void => {
      frame = 0;

      const travel = Math.max(canvas.clientHeight - window.innerHeight, 0);
      const shift = Math.min(window.scrollY * PARALLAX_FACTOR, travel);

      canvas.style.transform = `translate3d(0, ${-shift}px, 0)`;
    };

    const onScroll = (): void => {
      if (frame !== 0) return;

      frame = requestAnimationFrame(apply);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    apply();

    return () => {
      window.removeEventListener("scroll", onScroll);

      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface-900"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-x-0 top-0 h-[220%] w-full will-change-transform"
      />
    </div>
  );
}