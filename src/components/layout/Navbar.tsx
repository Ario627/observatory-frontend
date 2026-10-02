"use client"

import { useEffect, useState } from "react"
import { useActiveSectionId } from "./ActiveSectionProvider"
import { cn } from "@/lib/cn"
import { SECTIONS } from "@/lib/constants"
import { GhostPill } from "../ui/GhostPill"


const LIFT_AT_PX = 8;
const NAV_SECTIONS = SECTIONS.slice(1);

export function Navbar() {
    const activeId = useActiveSectionId();

    const [lifted, setLifted] = useState(false);

    useEffect(() => {
        let frame = 0;

        const apply = () => {
            frame = 0
            setLifted(window.scrollY > LIFT_AT_PX)
        }

        const onScroll = (): void => {
            if (frame !== 0) return;
            
            frame = requestAnimationFrame(apply);
        }

        window.addEventListener("scroll", onScroll, {passive: true});
        apply();

        return () => {
            window.removeEventListener("scroll", onScroll);
            if (frame !== 0) cancelAnimationFrame(frame);
        }
    }, [])

    return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color] duration-300 ease-celestial",
        lifted ? "glass-l1 border-hairline-soft" : "border-transparent",
      )}
    >
      <nav
        aria-label="Navigasi lapisan"
        className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6"
      >
        <a href="#hero" className="flex min-h-11 shrink-0 items-center gap-2.5">
          <span className="text-[15px] font-extrabold tracking-[-0.01em] text-ice">
            AMBIS
          </span>
          <span className="mono-num hidden text-[9px] text-slate sm:inline">
            PURWOKERTO
          </span>
        </a>

        <div className="ml-auto hidden items-center gap-5 md:flex lg:gap-6">
          {NAV_SECTIONS.map((section) => {
            const active = section.id === activeId;

            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "relative py-2 text-[13px] transition-colors duration-150 ease-celestial",
                  "after:absolute after:inset-x-0 after:bottom-0.5 after:h-px after:origin-center after:bg-cyan after:content-[''] after:transition-transform after:duration-300 after:ease-celestial",
                  active
                    ? "text-ice after:scale-x-100"
                    : "text-slate after:scale-x-0 hover:text-ice-dim",
                )}
              >
                {section.label}
              </a>
            );
          })}
        </div>

        <GhostPill href="/sky" size="sm" className="ml-auto md:ml-0">
          Langit
        </GhostPill>
      </nav>
    </header>
  );
}