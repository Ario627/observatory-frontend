import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export type PilLSize = "sm" | "md";

type GhostShell = {
  children: ReactNode;
  className?: string;
  size?: PilLSize;
};

type GhostAnchor = GhostShell & { href: string } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
>;

type GhostButton = GhostShell & { href?: undefined } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children"
>;

export type GhostPillProps = GhostAnchor | GhostButton;

const SIZES: Record<PilLSize, string> = {
  sm: "min-h-8 px-3 text-[12px] pointer-coarse:min-h-11",
  md: "min-h-9 px-4 text-[13px] pointer-coarse:min-h-11",
};

const SHELL = cn(
  "inline-flex touch-manipulation select-none items-center justify-center gap-2",
  "glass-l1 whitespace-nowrap rounded-pill border border-hairline text-ice",
  "transition-[transform,border-color,color] duration-150 ease-celestial",
  "motion-safe:hover:border-hairline-cyan motion-safe:hover:text-cyan-bright",
  "motion-safe:active:scale-[0.97]",
  "disabled:pointer-events-none disabled:opacity-45",
);

function isAnchor(props: GhostPillProps): props is GhostAnchor {
  return typeof props.href === "string";
}

export function GhostPill(props: GhostPillProps) {
  if (isAnchor(props)) {
    const { size = "md", className, children, href, ...rest } = props;

    return (
      <Link href={href} className={cn(SHELL, SIZES[size], className)} {...rest}>
        {children}
      </Link>
    );
  }

  const { size = "md", className, children, ...rest } = props;

  return (
    <button type="button" className={cn(SHELL, SIZES[size], className)} {...rest}>
      {children}
    </button>
  );
}