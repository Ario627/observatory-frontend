import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

export type IconSize = 16 | 20 | 24;

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: IconSize;
  label?: string;
};

function createIcon(diplayName: string, glyph: ReactNode) {
    function Icon({size = 24, label, className, ...rest}: IconProps) {
        const decorative = label === undefined;
        return (
            <svg
            {...rest}
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
            aria-hidden={decorative ? true : undefined}
            role={decorative ? undefined : "img"}
            aria-label={label}
            className={cn("shrink-0", className)}
            >
                {glyph}
            </svg>
        )
    }

    Icon.displayname = diplayName;
    return Icon;
}

export const PlayIcon = createIcon("PlayIcon", <path d="M9 6.2 17.4 12 9 17.8Z" />);

export const PauseIcon = createIcon(
  "PauseIcon",
  <path d="M9.6 6.2v11.6M14.4 6.2v11.6" />,
);

export const PanIcon = createIcon(
  "PanIcon",
  <>
    <path d="M12 3.8v16.4M3.8 12h16.4" />
    <path d="M9.7 6.1 12 3.8l2.3 2.3M9.7 17.9 12 20.2l2.3-2.3M6.1 9.7 3.8 12l2.3 2.3M17.9 9.7 20.2 12l-2.3 2.3" />
  </>,
);

export const SearchIcon = createIcon(
  "SearchIcon",
  <>
    <circle cx="10.8" cy="10.8" r="6.6" />
    <path d="M15.6 15.6 20.4 20.4" />
  </>,
);

export const CloseIcon = createIcon(
  "CloseIcon",
  <path d="M6.3 6.3 17.7 17.7M17.7 6.3 6.3 17.7" />,
);

const ChevronGlyph = createIcon(
  "ChevronGlyph",
  <path d="M9.6 5.6 16 12l-6.4 6.4" />,
);

export type ChevronDirection = "up" | "down" | "left" | "right";

const CHEVRON_ROTATION: Record<ChevronDirection, string> = {
  right: "",
  down: "rotate-90",
  left: "rotate-180",
  up: "-rotate-90",
};

export type ChevronIconProps = IconProps & {
  direction?: ChevronDirection;
};

export function ChevronIcon({
  direction = "right",
  className,
  ...rest
}: ChevronIconProps) {
  return (
    <ChevronGlyph
      {...rest}
      className={cn(CHEVRON_ROTATION[direction], className)}
    />
  );
}

export const SatelliteIcon = createIcon(
  "SatelliteIcon",
  <>
    <rect x="8.6" y="7.4" width="6.8" height="9.2" rx="1.2" />
    <rect x="2.4" y="9.6" width="4.2" height="4.8" rx="0.6" />
    <rect x="17.4" y="9.6" width="4.2" height="4.8" rx="0.6" />
    <path d="M6.6 12h2M15.4 12h2" />
    <path d="M12 7.4V4.2M10.4 4.2h3.2" />
  </>,
);

export const TelescopeIcon = createIcon(
  "TelescopeIcon",
  <>
    <path d="M4 10.6 13.6 5.4l3.4 6.2-9.6 5.2Z" />
    <path d="M10.6 13.4 8.4 20.6M10.6 13.4l2.2 7.2M6.4 20.8h8.4" />
  </>,
);

export const BatteryIcon = createIcon(
  "BatteryIcon",
  <>
    <rect x="2.5" y="7.5" width="16" height="9" rx="1.5" />
    <path d="M21 10.6v2.8" />
    <path d="M5.6 10.5h4.2v3H5.6Z" />
  </>,
);

export const WifiIcon = createIcon(
  "WifiIcon",
  <>
    <path d="M3.5 9.2a13 13 0 0 1 17 0" />
    <path d="M6.6 12.6a8.6 8.6 0 0 1 10.8 0" />
    <path d="M9.6 16a4.2 4.2 0 0 1 4.8 0" />
    <path d="M12 19.3h.01" />
  </>,
);

export const CameraIcon = createIcon(
  "CameraIcon",
  <>
    <rect x="1.8" y="7.6" width="20.4" height="11" rx="2" />
    <path d="M8.4 7.6 9.9 5.2h4.2l1.5 2.4" />
    <circle cx="12" cy="13.1" r="3.5" />
  </>,
);