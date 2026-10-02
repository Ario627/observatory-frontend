"use client";

import {motion} from "framer-motion"
import type { MotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { MOTION } from "@/lib/constants";
import { useReduceMotion } from "@/hooks/useReduceMotion";

const REVEAL_DISTANCE = 16;
const VISIBLE_AMOUNT = 0.2;
const VIEWPORT_MARGIN = "0px 0px -6% 0px";

export type RevealTag = "div" | "section";

export type RevealProps = {
  children: ReactNode;
  as?: RevealTag;
  delayMs?: number;
  distance?: number;
  once?: boolean;
  className?: string;
};

export function Reveal({
    children,
    as = "div",
    delayMs = 0,
    distance = REVEAL_DISTANCE,
    once = true,
    className,
}: RevealProps) {
    const reduced = useReduceMotion();

  const shared = {
    className,
    initial: reduced ? false : { opacity: 0, y: distance },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once, amount: VISIBLE_AMOUNT, margin: VIEWPORT_MARGIN },
    transition: {
      duration: reduced ? 0 : MOTION.slow / 1_000,
      ease: MOTION.easing,
      delay: reduced ? 0 : delayMs / 1_000,
    },
  } satisfies MotionProps & { className?: string };


  if (as === "section") {
    return <motion.section {...shared}>{children}</motion.section>
  }


  return <motion.div {...shared}>{children}</motion.div>
}