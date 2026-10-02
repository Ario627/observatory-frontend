"use client";

import { LiveBadge } from "@/components/ui/LiveBadge";
import { ValueTick } from "@/components/ui/ValueTick";
import { useCelestialPosition } from "@/hooks/useCelestialPosition";
import { cn } from "@/lib/cn";
import type { TrackTarget } from "@/types/celestial";
import { DASH, formatAltitude, formatAzimuth, formatDistance } from "@/lib/format";

const ISS: TrackTarget = { type: "iss", id: "iss" };

export type IssTickerProps = {
  className?: string;
};

type TickProps = {
  label: string;
  text: string;
  dimmed: boolean;
};

function Tick({ label, text, dimmed }: TickProps) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="mono-num text-[9px] uppercase text-slate">{label}</span>
      <ValueTick
        value={text}
        className={cn(
          "mono-num text-[10px]",
          dimmed ? "text-slate" : "text-ice",
        )}
      />
    </span>
  );
}

function Separator() {
  return (
    <span
      aria-hidden="true"
      className="hidden select-none text-hairline-strong sm:inline"
    >
      ·
    </span>
  );
}

export function IssTicker({ className }: IssTickerProps) {
  const { data, status } = useCelestialPosition(ISS);
  const dimmed = status === "stale" || status === "offline";

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5", className)}>
      <span className="mono-num text-[10px] uppercase text-ice">ISS</span>
      <Separator />
      <Tick
        label="AZ"
        text={data === null ? DASH : formatAzimuth(data.azimuth)}
        dimmed={dimmed}
      />
      <Separator />
      <Tick
        label="ALT"
        text={data === null ? DASH : formatAltitude(data.altitude)}
        dimmed={dimmed}
      />
      <Separator />
      <Tick
        label="JARAK"
        text={
          data === null
            ? DASH
            : formatDistance(data.distanceKm, data.distanceAu)
        }
        dimmed={dimmed}
      />
      <Separator />
      <LiveBadge status={status} />
    </div>
  );
}