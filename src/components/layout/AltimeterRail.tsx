"use client"

import { useMotionValue, motion, useScroll, useSpring } from "framer-motion"
import { useEffect } from "react"
import { useActiveSectionId } from "./ActiveSectionProvider"
import { useReduceMotion } from "@/hooks/useReduceMotion"
import { SECTIONS } from "@/lib/constants"
import { clamp } from "@/lib/coordinates"

const RAIL_HEIGHT_PX = 288;
const ALTITUDE_FLOOR_M = 10;
const ALTITUDE_CEILING_M = 400_000;
const VIEWPOINT_RAIL = 0.84;
const RAIL_MIN = 0.03;
const RAIL_MAX = 0.97;

const RAIL_SPRING = { stiffness: 130, damping: 26, mass: 0.7 };
const BAR_SPRING = { stiffness: 240, damping: 40, mass: 0.6 };

const FIRST = SECTIONS[0];

function railFraction(altitudeM: number | null): number {
    if (altitudeM === null) return VIEWPOINT_RAIL;

    const floor = Math.log10(ALTITUDE_FLOOR_M);
    const ceiling = Math.log10(ALTITUDE_CEILING_M)
    const lift = Math.log10(Math.max(altitudeM, 0) + ALTITUDE_FLOOR_M)
    const climb = (lift - floor) / (ceiling - floor);

    return clamp(1 - climb, RAIL_MIN, RAIL_MAX);
}

function altitudeTag(altitudeM: number | null): string {
    if (altitudeM === null) return "MATA";
    if (altitudeM < 1_000) return `${altitudeM} M`;
    const km = altitudeM / 1_000;

    return `${Number.isInteger(km) ? km : km.toFixed(1)} KM`;

}


export function AltimeterRail() {
    const activeId = useActiveSectionId();
    const reduced = useReduceMotion();
    const {scrollYProgress} = useScroll();

    const current =SECTIONS.find((section) => section.id === activeId ) ?? FIRST;

    const target = useMotionValue(railFraction(FIRST.altitudeM) * RAIL_HEIGHT_PX)

    const glide = useSpring(target, RAIL_SPRING)
    const barFill = useSpring(scrollYProgress, BAR_SPRING)


    useEffect(() => {
        target.set(railFraction(current.altitudeM) * RAIL_HEIGHT_PX)
    },  [current, target])


    return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 md:block lg:right-6"
      >
        <div className="relative" style={{ height: RAIL_HEIGHT_PX }}>
          <span className="absolute inset-y-0 right-0 w-px bg-hairline-soft" />

          {SECTIONS.map((section) => (
            <span
              key={section.id}
              className="absolute right-0 size-1 -translate-y-1/2 translate-x-1/2 rounded-pill bg-hairline-strong"
              style={{ top: `${railFraction(section.altitudeM) * 100}%` }}
            />
          ))}

          <motion.div
            className="absolute inset-x-0 top-0"
            style={{ y: reduced ? target : glide }}
          >
            <div className="flex -translate-y-1/2 items-center justify-end gap-2.5">
              <span className="mono-num whitespace-nowrap text-[8px] uppercase text-cyan-bright">
                {`${altitudeTag(current.altitudeM)} · ${current.label}`}
              </span>
              <span className="glow-soft size-1.5 rounded-pill bg-cyan" />
            </div>
          </motion.div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-14 z-30 h-0.5 bg-hairline-soft md:hidden"
      >
        <motion.div
          className="h-full origin-left bg-cyan"
          style={{ scaleX: reduced ? scrollYProgress : barFill }}
        />
      </div>
    </>
  );
}