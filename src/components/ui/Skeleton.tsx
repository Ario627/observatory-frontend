import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

export type SkeletonTone = "text" | "panel" | "circle";

const TONES: Record<SkeletonTone, string> = {
  text: "h-3 rounded-pill",
  panel: "rounded-panel",
  circle: "aspect-square rounded-pill",
};

export type SkeletonProps = {
  tone?: SkeletonTone;
  width?: number | string;
  height?: number | string;
  className?: string;
};

function size(value: number | string | undefined): string | undefined {
  return typeof value === "number" ? `${value}px` : value;
}

export function Skeleton({
  tone = "text",
  width,
  height,
  className,
}: SkeletonProps) {
  const widthValue = size(width);
  const heightValue = size(height);
  const style: CSSProperties = {};

  if (widthValue !== undefined) style.width = widthValue;
  if (heightValue !== undefined) style.height = heightValue;

  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn("panel-l2 block", TONES[tone], className)}
    />
  );
}

export type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <span aria-hidden="true" className={cn("block space-y-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          tone="text"
          className={index === lines - 1 ? "w-3/5" : "w-full"}
        />
      ))}
    </span>
  );
}