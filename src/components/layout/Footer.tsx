import { Hairline } from "@/components/ui/Hairline";
import { GhostPill } from "@/components/ui/GhostPill";
import { PrimaryBeaconPill } from "@/components/ui/PrimaryBeaconPill";
import { Reveal } from "@/components/ui/Reveal";
import { OBSERVER } from "@/lib/coordinates";
import { formatDeg } from "@/lib/format";
import { cn } from "@/lib/cn";

export type FooterProps = {
  docsUrl?: string;
  repoUrl?: string;
  className?: string;
};

const OBSERVATORY_LINE = `OBS · ${formatDeg(OBSERVER.latitude, 4)}, ${formatDeg(OBSERVER.longitude, 4)}`;

export function Footer({ docsUrl, repoUrl, className }: FooterProps) {
  const hasSecondaryLinks = docsUrl !== undefined || repoUrl !== undefined;

  return (
    <footer
      className={cn(
        "relative px-4 pb-10 pt-24 sm:px-6 sm:pt-32",
        className,
      )}
    >
      <Hairline className="absolute inset-x-0 top-0" />

      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <p className="eyebrow text-[9px] text-slate">LAYER · 06 — PENUTUP</p>
        </Reveal>

        <Reveal delayMs={80}>
          <h2 className="mt-5 max-w-[22ch] text-balance text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.015em] text-ice">
            Lihat langit dari tempat yang sama dengan antena.
          </h2>
        </Reveal>

        <Reveal delayMs={160}>
          <p className="mt-5 max-w-[58ch] text-pretty text-[15px] leading-relaxed text-ice-dim sm:text-base">
            Panorama 360° dengan posisi Matahari, Bulan, planet, dan ISS persis
            di tempat yang dihitung backend.
          </p>
        </Reveal>

        <Reveal delayMs={240}>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <PrimaryBeaconPill href="/sky">Buka langit</PrimaryBeaconPill>
            <GhostPill href="#hero">Kembali ke atas</GhostPill>
          </div>
        </Reveal>

        {hasSecondaryLinks ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {docsUrl === undefined ? null : (
              <GhostPill href={docsUrl} size="sm">
                Dokumentasi
              </GhostPill>
            )}
            {repoUrl === undefined ? null : (
              <GhostPill href={repoUrl} size="sm">
                Repositori
              </GhostPill>
            )}
          </div>
        ) : null}

        <Hairline className="mt-16 sm:mt-20" />

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono-num text-[9px] uppercase text-slate">
            {`${OBSERVATORY_LINE} · ${OBSERVER.label}`}
          </p>
          <p className="mono-num text-[9px] uppercase text-slate">
            Astro data · Skyfield JPL DE421
          </p>
        </div>
      </div>
    </footer>
  );
}