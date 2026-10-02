"use client";

import { cn } from "@/lib/cn";
import { DASH, formatAltitude, formatAzimuth } from "@/lib/format";

export type ObjectChipProps = {
  label: string;
  azimuth: number | null;
  altitude: number | null;
  visible: boolean;
  active: boolean;
  onSelect: () => void;
  className?: string;
};

export function ObjectChip({
  label,
  azimuth,
  altitude,
  visible,
  active,
  onSelect,
  className,
}: ObjectChipProps) {
  const values =
    azimuth === null || altitude === null
      ? DASH
      : `${formatAzimuth(azimuth)} · ${formatAltitude(altitude)}`;

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "inline-flex min-h-8 shrink-0 touch-manipulation items-center gap-2.5 rounded-pill bg-chip px-3.5 py-1.5 ring-1 transition-[box-shadow,color] duration-150 ease-celestial pointer-coarse:min-h-11",
        active
          ? "glow-soft ring-hairline-cyan"
          : "ring-hairline motion-safe:hover:ring-hairline-cyan",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-pill",
          visible ? "glow-soft bg-cyan" : "bg-slate",
        )}
      />
      <span className="text-[12px] font-medium text-ice">{label}</span>
      <span
        className={cn(
          "mono-num text-[9px]",
          active ? "text-cyan-bright" : "text-slate",
        )}
      >
        {values}
      </span>
    </button>
  );
}