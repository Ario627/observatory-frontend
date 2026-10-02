import { cn } from "@/lib/cn";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";


export type PillSize = "sm" | "md";

type BeaconShell = {
  children: ReactNode;
  className?: string;
  size?: PillSize;
};

type BeaconAnchor = BeaconShell & { href: string } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
>;

type BeaconButton = BeaconShell & { href?: undefined } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children"
>;

export type PrimaryBeaconPillProps = BeaconAnchor | BeaconButton;

const SIZES: Record<PillSize, string> = {
  sm: "min-h-9 px-4 text-[13px] pointer-coarse:min-h-11",
  md: "min-h-11 px-6 text-sm pointer-coarse:min-h-12",
};

const SHELL = cn(
  "inline-flex touch-manipulation select-none items-center justify-center gap-2",
  "whitespace-nowrap rounded-pill bg-cyan font-semibold text-void",
  "glow-soft transition-[transform,box-shadow] duration-150 ease-celestial",
  "motion-safe:hover:scale-[1.03] motion-safe:hover:glow-strong",
  "motion-safe:active:scale-[0.97]",
  "disabled:pointer-events-none disabled:opacity-45",
);

function isAnchor(props: PrimaryBeaconPillProps): props is BeaconAnchor {
  return typeof props.href === "string";
}


export function PrimaryBeaconPill(props: PrimaryBeaconPillProps) {
    if (isAnchor(props)) {
        const { size = "md", className, children, href, ...rest } = props;


        return (
            <Link href={href} className={cn(SHELL, SIZES[size], className)} {...rest}>
                {children}
            </Link>
        )
    }

    const { size = "md", className, children, ...rest } = props;

    return (
        <button type="button" className={cn(SHELL, SIZES[size], className)} {...rest}>
        {children}
        </button>
    );
}