"use client";

import { animate, useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { MOTION } from "@/lib/constants";

export type CountUpOptions = {
  revealMs?: number;
  tickMs?: number;
};

export type CountUp = {
  value: number | null;
  attach: (node: HTMLElement | null) => void;
};

const VISIBLE_AMOUNT = 0.5;

export function useCountUp(
  target: number | null,
  options: CountUpOptions = {},
): CountUp {
  const { revealMs = MOTION.slow, tickMs = MOTION.tick } = options;

  const element = useRef<HTMLElement | null>(null);
  const shown = useRef(0);
  const started = useRef(false);
  const reduced = useReduceMotion();
  const [value, setValue] = useState<number | null>(null);
  const revealed = useInView(element, { once: true, amount: VISIBLE_AMOUNT });

  const attach = useCallback((node: HTMLElement | null) => {
    element.current = node;
  }, []);

  useEffect(() => {
    if (target === null) {
      setValue(null);
      return;
    }

    if (!revealed) return;

    const first = !started.current;
    started.current = true;

    if (reduced || shown.current === target) {
      shown.current = target;
      setValue(target);
      return;
    }

    const controls = animate(first ? 0 : shown.current, target, {
      duration: (first ? revealMs : tickMs) / 1_000,
      ease: MOTION.easing,
      onUpdate: (latest: number) => {
        shown.current = latest;
        setValue(latest);
      },
      onComplete: () => {
        shown.current = target;
        setValue(target);
      },
    });

    return () => controls.stop();
  }, [revealed, target, reduced, revealMs, tickMs]);

  return { value, attach };
}
