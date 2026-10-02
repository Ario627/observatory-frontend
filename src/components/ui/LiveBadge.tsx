import { cn } from "@/lib/cn";
import type { FeedStatus } from "@/types/celestial";


export type LiveBadgeProps = {
  status: FeedStatus;
  className?: string;
};

type Tone = {
  word: string;
  dot: string;
  text: string;
};

const TONES: Record<FeedStatus, Tone | null> = {
  loading: null,
  live: {
    word: "LIVE",
    dot: "bg-cyan glow-soft motion-safe:animate-pulse",
    text: "text-cyan-bright",
  },
  stale: { word: "STALE", dot: "bg-slate", text: "text-slate" },
  offline: { word: "OFFLINE", dot: "bg-danger", text: "text-danger" },
};

export function LiveBadge({status, className}: LiveBadgeProps) {
    const tone = TONES[status];

    if (tone === null) return null;

    return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-pill", tone.dot)}
      />
      <span className={cn("mono-num text-[9px] uppercase", tone.text)}>
        {tone.word}
      </span>
    </span>
  );
}