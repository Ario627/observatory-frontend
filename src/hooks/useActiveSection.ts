"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import type { RefCallback } from "react";

const READING_LINE = "-38% 0px -38% 0px";
const HYSTERESIS_PX = 24;

const THRESHOLDS: number[] = Array.from(
  { length: 101 },
  (_, index) => index / 100,
);

export type ActiveSection = {
  activeId: string | null;
  refFor: (id: string) => RefCallback<HTMLElement>;
};


function leaderOf(
    order: readonly string[],
    coverage: ReadonlyMap<string, number>,
    previous: string | null,
): string | null {
    let leader: string | null = null;
    let leaderArea = 0;

    for (const id of order) {
        const area = coverage.get(id) ?? 0;

        if (area <= leaderArea) continue;

        leader = id;
        leaderArea = area;
    }

    if (leader === null ) return previous;
    if (previous === null || leader === previous) return leader;


    const previousArea = coverage.get(previous) ?? 0;

    if (previousArea === 0) return leader;

    return leaderArea - previousArea <= HYSTERESIS_PX ? previous : leader;
}


export function useActiveSection(order: readonly string[]): ActiveSection {
    const [activeId, setActiveId] = useState<string | null>(null);
    const nodes = useRef(new Map<string, HTMLElement>())
    const owners = useRef(new WeakMap<Element, string>());
    const coverage = useRef(new Map<string, number>());
    const callbacks = useRef(new Map<string, RefCallback<HTMLElement>>());
    const observer = useRef<IntersectionObserver | null>(null);


    const apply = useEffectEvent((entries: IntersectionObserverEntry[]): void => {
        for(const entry of entries) {
            const id = owners.current.get(entry.target)
            if (id === undefined) return ;

            const area = entry.isIntersecting ? entry.intersectionRect.height : 0

            if (area > 0) coverage.current.set(id, area)
            else coverage.current.delete(id)
        }

        setActiveId((previous) => leaderOf(order, coverage.current, previous));
    })


    useEffect(() => {
        if (typeof IntersectionObserver === "undefined") return;

        const instance = new IntersectionObserver(
            (entries) => apply(entries),
            {rootMargin: READING_LINE, threshold: THRESHOLDS},
        )

        observer.current = instance

        for (const node of nodes.current.values()) instance.observe(node)
        

        return () => {
          observer.current = null;
          instance.disconnect();
          coverage.current.clear();
        };

    }, [])



    const refFor = useCallback((id: string): RefCallback<HTMLElement> => {
        const cached = callbacks.current.get(id);

        if (cached !== undefined) return cached;


        const attach: RefCallback<HTMLElement> = (node) => {
            const known = nodes.current.get(id)

            if (node === null) {
                if (known !== undefined) observer.current?.unobserve(known) 

                nodes.current.delete(id)
                coverage.current.delete(id);
                return;
            }

            if (known === node ) return;

            nodes.current.set(id, node)
            owners.current.set(node, id)
            observer.current?.observe(node)
        }

        callbacks.current.set(id, attach)

        return attach
    }, [])

    return { activeId, refFor };
}