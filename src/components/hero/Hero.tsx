"use client";
import type { Ref } from "react";
import { SectionShell } from "../ui/SectionShell";
import { Reveal } from "../ui/Reveal";
import { TelemetryChip } from "../ui/TelemetryChip";
import { PrimaryBeaconPill } from "../ui/PrimaryBeaconPill";
import { IssTicker } from "./IssTicker";
import { OBSERVER } from "@/lib/coordinates";
import { formatDeg } from "@/lib/format";

export type HeroProps = {
  ref?: Ref<HTMLElement>;
};

const OBSERVER_COORDINATES = `${formatDeg(OBSERVER.latitude, 4)}, ${formatDeg(OBSERVER.longitude, 4)}`;


export function Hero({ ref }: HeroProps) {
  return (
    <SectionShell
      ref={ref}
      id="hero"
      index={1}
      name="Stasiun tanah"
      level={1}
      display
      height="screen"
      divider={false}
      headline="Observatorium mini dari Semarang, menatap orbit detik ini."
      lead="Antena tahu arahnya karena backend yang menghitung"
    >
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
          <Reveal delayMs={200}>
            <TelemetryChip label="OBS" value={OBSERVER_COORDINATES} />
          </Reveal>
          <Reveal delayMs={250}>
            <IssTicker />
          </Reveal>
        </div>

        <Reveal delayMs={300}>
          <PrimaryBeaconPill href="/sky">Buka langit</PrimaryBeaconPill>
        </Reveal>
      </div>
    </SectionShell>
  );
}