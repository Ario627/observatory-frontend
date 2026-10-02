"use client";



import { useState } from "react";
import type { Ref } from "react";
import { ObjectChip } from "./ObjectChip";
import { SkyDial } from "./SkyDial";
import { SectionShell } from "@/components/ui/SectionShell";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { OfflineNotice } from "@/components/ui/OfflineNotice";
import { TelemetryRow } from "@/components/ui/TelemetryRow";
import type { TelemetryItem } from "@/components/ui/TelemetryRow";
import { useObjectsCatalog } from "@/hooks/useObjectsCatalog";
import { useSkySnapshots } from "@/hooks/useSkySnapshots";
import { skyTargetsOf } from "@/lib/celestial-content";



import {
  DASH,
  formatAltitude,
  formatAzimuth,
  formatClockWIB,
  formatDistance,
} from "@/lib/format";
import type { SkySnapshot } from "@/types/celestial";

const ISS_ID = "iss";
const STAGGER_MS = 150;

export type SkySectionProps = {
  ref?: Ref<HTMLElement>;
};

function detailItems(snapshot: SkySnapshot): TelemetryItem[] {
  const items: TelemetryItem[] = [
    { label: "AZ", value: formatAzimuth(snapshot.az), emphasis: true },
    { label: "ALT", value: formatAltitude(snapshot.alt), emphasis: true },
    { label: "JARAK", value: formatDistance(snapshot.distanceKm, null) },
    {
      label: "STATUS",
      value: snapshot.visible ? "TERLIHAT" : "DI BAWAH HORIZON",
    },
  ];

  if (snapshot.kind === "satellite" && snapshot.illuminated !== null) {
    items.push({
      label: "SINAR",
      value: snapshot.illuminated ? "TERSINARI" : "DI BAYANGAN",
    });
  }

  return items;
}

export function SkySection({ ref }: SkySectionProps) {
  const catalog = useObjectsCatalog();
  const targets = skyTargetsOf(catalog.data);
  const sky = useSkySnapshots(
    targets.map((entry) => entry.target),
    { staggerMs: STAGGER_MS },
  );
  const [pickedId, setPickedId] = useState<string | null>(null);

  const snapshots = sky.data ?? [];
  const byId = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  const fallbackId = targets.some((entry) => entry.id === ISS_ID)
    ? ISS_ID
    : (targets[0]?.id ?? null);
  const selectedId =
    pickedId !== null && targets.some((entry) => entry.id === pickedId)
      ? pickedId
      : fallbackId;
  const selectedLabel =
    targets.find((entry) => entry.id === selectedId)?.label ?? null;
  const selectedSnapshot =
    selectedId === null ? null : (byId.get(selectedId) ?? null);
  const aboveCount = snapshots.filter((snapshot) => snapshot.visible).length;

  return (
    <SectionShell
      ref={ref}
      id="sky"
      index={2}
      name="Langit sekarang"
      headline="Posisi objek hari ini, dihitung untuk titik ini."
      lead="Dial menggambar langit apa adanya. Objek yang sedang di bawah horizon tetap tampil, hanya diredupkan di luar ring."
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="min-w-0">
          <SkyDial
            snapshots={snapshots}
            selectedId={selectedId}
            selectedLabel={selectedLabel}
          />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <LiveBadge status={sky.status} />
            {snapshots.length === 0 ? null : (
              <span className="mono-num text-[9px] uppercase text-slate">
                {`${aboveCount} terlihat · ${snapshots.length - aboveCount} di bawah horizon`}
              </span>
            )}
          </div>

          {sky.status === "offline" ? (
            <OfflineNotice
              updatedAtMs={sky.updatedAtMs}
              message={sky.error ?? undefined}
              onRetry={sky.refresh}
              className="mt-4"
            />
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {targets.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-slate">
              Katalog objek belum tersedia dari backend.
            </p>
          ) : (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
              {targets.map((entry) => {
                const snapshot = byId.get(entry.id) ?? null;

                return (
                  <ObjectChip
                    key={entry.id}
                    label={entry.label}
                    azimuth={snapshot?.az ?? null}
                    altitude={snapshot?.alt ?? null}
                    visible={snapshot?.visible ?? false}
                    active={entry.id === selectedId}
                    onSelect={() => setPickedId(entry.id)}
                  />
                );
              })}
            </div>
          )}

          <div className="panel-l2 rounded-panel px-4 py-4 ring-1 ring-hairline sm:px-5">
            {selectedSnapshot === null || selectedLabel === null ? (
              <p className="text-[13px] text-slate">
                Pilih objek untuk membaca posisinya.
              </p>
            ) : (
              <>
                <p className="eyebrow text-[8px] text-slate">OBJEK DIPILIH</p>
                <p className="mt-2 text-[15px] font-semibold text-ice">
                  {selectedLabel}
                </p>
                <TelemetryRow
                  items={detailItems(selectedSnapshot)}
                  stale={sky.status !== "live"}
                  className="mt-3"
                />
                <p className="mono-num mt-3 text-[9px] uppercase text-slate">
                  {`Update ${formatClockWIB(selectedSnapshot.ts)} WIB`}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}