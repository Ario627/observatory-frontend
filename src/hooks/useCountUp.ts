"use client";

import { animate, useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { MOTION } from "@/lib/constants";
import { useReducedMotion } from "framer-motion";

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

    const elements = useRef<HTMLElement | null>(null);
    const shown = useRef(0);
    const reduced = useReducedMotion();
    const [value, setValue] = useState<number | null>(null);
    const revealed = useInView(elements, {
        once: true,
        amount: VISIBLE_AMOUNT,
    })

    const attach = useCallback((node: HTMLElement | null) => {
        elements.current = node;
    }, []);


    useEffect(() => {
        if(target === null) {
            shown.current = 0;
            setValue(null);
            return;
        }

        if (!revealed) return;


        const first = shown.current ===  null;        
        const from = shown.current ?? 0;

        if (reduced || from === target) {
            shown.current = target;
            setValue(target);
            return;
        }

        const controls = animate(from, target, {
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