import type { ComponentProps, ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Hairline } from "./Hairline";
import { Reveal } from "./Reveal";

export type SectionShellProps = Omit<
  ComponentProps<"section">,
  "children" | "id" | "title"
> & {
  id: string;
  index: number;
  name: string;
  headline: ReactNode;
  lead?: ReactNode;
  align?: "start" | "center";
  divider?: boolean;
  reveal?: boolean;
  height?: "auto" | "screen";
  children: ReactNode;
};

const ALIGN: Record<"start" | "center", string> = {
  start: "items-start text-left",
  center: "items-center text-center",
};

const LEAD_ALIGN: Record<"start" | "center", string> = {
  start: "",
  center: "mx-auto",
};

const HEIGHT: Record<"auto" | "screen", string> = {
  auto: "",
  screen: "min-h-[88svh]",
};

const HairlineLine = Hairline as unknown as ComponentType<{
  className?: string;
}>;

export function SectionShell({
  id,
  index,
  name,
  headline,
  lead,
  align = "start",
  divider = true,
  reveal = true,
  height = "auto",
  className,
  children,
  ...rest
}: SectionShellProps) {
  const layer = String(index).padStart(2, "0");

  const enter = (node: ReactNode, delayMs: number) =>
    reveal ? <Reveal delayMs={delayMs}>{node}</Reveal> : node;

  return (
    <section
      {...rest}
      id={id}
      className={cn(
        "relative scroll-mt-24 px-4 py-24 sm:px-6 sm:py-32",
        HEIGHT[height],
        className,
      )}
    >
      {divider ? <HairlineLine className="absolute inset-x-0 top-0" /> : null}

      <div className={cn("flex flex-col", ALIGN[align])}>
        {enter(
          <p className="eyebrow text-[9px] text-slate">
            {`LAYER · ${layer} — ${name}`}
          </p>,
          0,
        )}

        {enter(
          <h2 className="mt-5 max-w-[54ch] text-balance text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.015em] text-ice">
            {headline}
          </h2>,
          80,
        )}

        {lead === undefined
          ? null
          : enter(
              <p
                className={cn(
                  "mt-5 max-w-[62ch] text-pretty text-[15px] leading-relaxed text-ice-dim sm:text-base",
                  LEAD_ALIGN[align],
                )}
              >
                {lead}
              </p>,
              160,
            )}
      </div>

      <div className="mt-14 sm:mt-20">{children}</div>
    </section>
  );
}