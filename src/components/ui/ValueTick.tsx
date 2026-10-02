"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const TICK_MS = 180;

export type ValueTickProps = {
  value: string;
  className?: string;
};

type Frame = {
  id: number;
  text: string;
};

export function ValueTick({ value, className }: ValueTickProps) {
    const nextId = useRef(0);
    const [frames, setFrames] = useState<Frame[]>(() => [{id: nextId.current, text: value}])

    useEffect(() => {
        setFrames((previous) => {
            const tail = previous.at(-1);

            if (tail !== undefined && tail.text === value) return previous;

            nextId.current += 1;
            return [...previous.slice(-1), {id: nextId.current, text: value}]
        })
    }, [value])

    useEffect(() => {
    if (frames.length <= 1) return;

    const timer = setTimeout(() => {
      setFrames((previous) => previous.slice(-1));
    }, TICK_MS);

    return () => clearTimeout(timer);
  }, [frames]);

  return (
    <span className={cn("inline-grid", className)}>
      {frames.map((frame, index) => {
        const outgoing = index < frames.length - 1;

        return (
          <span
            key={frame.id}
            aria-hidden={outgoing || undefined}
            className={cn(
              "col-start-1 row-start-1 whitespace-nowrap",
              outgoing ? "tick-out" : "tick-in",
            )}
          >
            {frame.text}
          </span>
        );
      })}
    </span>
  );
}