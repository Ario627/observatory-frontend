"use client"


import { GhostPill } from "../ui/GhostPill"
import { Skeleton } from "../ui/Skeleton"
import {TelemetryRow} from "../ui/TelemetryRow"
import type { TelemetryItem } from "../ui/TelemetryRow"
import { useNow } from "@/hooks/useNow"
import { cn } from "@/lib/cn"
import { DASH, formatAltitude, formatAzimuth, formatClockWIB, formatCountdown, formatDuration } from "@/lib/format"
import type { FeedStatus, PassInfo } from "@/types/celestial"

export type PassCountdownProps = {
  pass: PassInfo | null;
  status: FeedStatus;
  onRefresh?: () => void;
  className?: string;
};

type Countdown = {
  phase: "aos" | "los";
  seconds: number;
};