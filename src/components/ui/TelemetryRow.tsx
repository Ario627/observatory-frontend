import { Fragment } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TelemetryItem = {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  live?: boolean;
};

export type TelemetryRowProps = {
  items: readonly TelemetryItem[];
  stale?: boolean;
  className?: string;
};

export function TelemetryRow({
  items,
  stale = false,
  className,
}: TelemetryRowProps) {
  return (
    <dl
      className={cn(
        "flex flex-wrap items-baseline gap-x-2.5 gap-y-1",
        className,
      )}
    >
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? (
            <span
              aria-hidden="true"
              className="select-none text-hairline-strong"
            >
              ·
            </span>
          ) : null}
          <div className="inline-flex items-baseline gap-1.5">
            {item.live ? (
              <span
                aria-hidden="true"
                className="glow-soft size-1.5 shrink-0 self-center rounded-pill bg-cyan motion-safe:animate-pulse"
              />
            ) : null}
            <dt className="mono-num text-[9px] uppercase text-slate">
              {item.label}
            </dt>
            <dd
              className={cn(
                "mono-num text-[10px]",
                item.emphasis ? "text-cyan-bright" : "text-ice",
                stale && "text-slate",
              )}
            >
              {item.value}
            </dd>
          </div>
        </Fragment>
      ))}
      {stale ? (
        <span className="mono-num text-[9px] uppercase text-slate">STALE</span>
      ) : null}
    </dl>
  );
}