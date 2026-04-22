import type { ReactNode } from "react";

type IconName =
  | "arrow" | "check" | "x" | "heart" | "link" | "share"
  | "dot" | "plus" | "clock" | "globe" | "pin" | "wallet" | "spark";

interface IconProps {
  name: IconName;
  size?: number;
}

const strokeProps = {
  stroke: "currentColor",
  strokeWidth: 1.25,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const paths: Record<IconName, ReactNode> = {
  arrow: <path {...strokeProps} d="M4 10h12M11 5l5 5-5 5" />,
  check: <path {...strokeProps} d="M4 10l4 4 8-10" />,
  x: <path {...strokeProps} d="M5 5l10 10M15 5L5 15" />,
  heart: <path {...strokeProps} d="M10 16s-6-4-6-8.5A3.5 3.5 0 0110 5a3.5 3.5 0 016 2.5C16 12 10 16 10 16z" />,
  link: <path {...strokeProps} d="M9 11a3 3 0 004 0l3-3a3 3 0 10-4-4l-1 1M11 9a3 3 0 00-4 0l-3 3a3 3 0 104 4l1-1" />,
  share: <path {...strokeProps} d="M5 10v5a1 1 0 001 1h8a1 1 0 001-1v-5M10 3v10M6 7l4-4 4 4" />,
  dot: <circle cx="10" cy="10" r="2" fill="currentColor" />,
  plus: <path {...strokeProps} d="M10 4v12M4 10h12" />,
  clock: (
    <g {...strokeProps}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 7v3l2 1.5" />
    </g>
  ),
  globe: (
    <g {...strokeProps}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M3.5 10h13M10 3.5c2 2 2 11 0 13M10 3.5c-2 2-2 11 0 13" />
    </g>
  ),
  pin: (
    <g {...strokeProps}>
      <path d="M10 17s5-4 5-9a5 5 0 10-10 0c0 5 5 9 5 9z" />
      <circle cx="10" cy="8" r="1.5" />
    </g>
  ),
  wallet: (
    <g {...strokeProps}>
      <rect x="3" y="6" width="14" height="10" rx="1" />
      <path d="M3 9h14M13 12h1" />
    </g>
  ),
  spark: (
    <path
      {...strokeProps}
      d="M10 3v4M10 13v4M3 10h4M13 10h4M5 5l2.5 2.5M12.5 12.5L15 15M5 15l2.5-2.5M12.5 7.5L15 5"
    />
  ),
};

export function Icon({ name, size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{ display: "inline-block", verticalAlign: "middle" }}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
