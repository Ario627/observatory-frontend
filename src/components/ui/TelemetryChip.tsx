import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TelemetryChipProps = {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  live?: boolean;
  title?: string;
  className?: string;
};

const SHELL = cn(
  "inline-flex items-center gap-2 rounded-pill bg-chip px-3 py-1.5",
  "ring-1 ring-hairline",
);

export function TelemetryChip({
  label,
  value,
  emphasis = false,
  live = false,
  title,
  className,
}: TelemetryChipProps) {
  return (
    <span className={cn(SHELL, className)} title={title}>
      {live ? (
        <span
          aria-hidden="true"
          className="glow-soft size-1.5 rounded-pill bg-cyan"
        />
      ) : null}
      <span className="mono-num text-[9px] uppercase text-slate">{label}</span>
      <span
        className={cn(
          "mono-num text-[11px]",
          emphasis ? "text-cyan-bright" : "text-ice",
        )}
      >
        {value}
      </span>
    </span>
  );
}