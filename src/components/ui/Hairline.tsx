import { cn } from "@/lib/cn";

export type HairlineOrientation = "horizontal" | "vertical";
export type HairlineTone = "soft" | "line" | "cyan";

export type HairlineProps = {
  orientation?: HairlineOrientation;
  tone?: HairlineTone;
  className?: string;
};

const ORIENTATION: Record<HairlineOrientation, string> = {
  horizontal: "h-px w-full",
  vertical: "w-px self-stretch",
};

const TONE: Record<HairlineTone, string> = {
  soft: "bg-hairline-soft",
  line: "bg-hairline",
  cyan: "bg-hairline-cyan",
};

export function Hairline({
  orientation = "horizontal",
  tone = "soft",
  className,
}: HairlineProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0",
        ORIENTATION[orientation],
        TONE[tone],
        className,
      )}
    />
  );
}