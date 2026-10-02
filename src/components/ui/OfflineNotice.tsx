"use client";

import {
  DASH,
  WIB_LABEL,
  formatClockWIB,
  formatDateWIB,
  formatDayKeyWIB,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { GhostPill } from "./GhostPill";

export type OfflineNoticeProps = {
  updatedAtMs: number | null;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function OfflineNotice({
  updatedAtMs,
  message,
  onRetry,
  className,
}: OfflineNoticeProps) {
  const staleDayKey = updatedAtMs === null ? DASH : formatDayKeyWIB(updatedAtMs);
  const sameDay =
    updatedAtMs !== null && staleDayKey === formatDayKeyWIB(Date.now());

  return (
    <div
      role="status"
      className={cn(
        "panel-l2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-panel px-3 py-2.5 ring-1 ring-hairline",
        className,
      )}
    >
      <span className="mono-num text-[9px] uppercase text-danger">OFFLINE</span>
      <p className="text-[12px] leading-snug text-slate">
        {message ?? "Backend tidak terjangkau"}
        {updatedAtMs !== null ? (
          <>
            {" — data terakhir "}
            <time
              dateTime={new Date(updatedAtMs).toISOString()}
              className="mono-num text-ice"
            >
              {sameDay
                ? formatClockWIB(updatedAtMs)
                : `${formatDateWIB(updatedAtMs)} · ${formatClockWIB(updatedAtMs)}`}
            </time>
            {` ${WIB_LABEL}`}
          </>
        ) : null}
      </p>
      {onRetry ? (
        <GhostPill size="sm" onClick={onRetry} className="ml-auto">
          Coba lagi
        </GhostPill>
      ) : null}
    </div>
  );
}