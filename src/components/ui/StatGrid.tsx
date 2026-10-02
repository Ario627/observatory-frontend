import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StatItem = {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  detail?: string;
};

export type StatGridProps = {
  items: readonly StatItem[];
  stale?: boolean;
  className?: string;
};


export function StatGrid({ items, stale = false, className }: StatGridProps) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-5 gap-y-4", className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="eyebrow text-[8px] text-slate">{item.label}</dt>
          <dd
            className={cn(
              "mono-num mt-1.5 text-[12px] whitespace-nowrap",
              item.emphasis ? "text-cyan-bright" : "text-ice",
              stale && "text-slate",
            )}
            title={item.detail}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}