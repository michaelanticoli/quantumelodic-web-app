import React from "react";

export type AspectName =
  | "conjunction" | "opposition" | "trine" | "square" | "sextile" | "quincunx";

interface Props {
  aspect: AspectName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  title?: string;
}

const PATHS: Record<AspectName, React.ReactNode> = {
  conjunction: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  opposition: (
    <>
      <circle cx="5" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="M7 12 H 17" />
    </>
  ),
  trine: (
    <path d="M12 4 L 20 19 L 4 19 Z" />
  ),
  square: (
    <rect x="5" y="5" width="14" height="14" />
  ),
  sextile: (
    <>
      <path d="M12 4 V 20" />
      <path d="M4.5 8 L 19.5 16" />
      <path d="M4.5 16 L 19.5 8" />
    </>
  ),
  quincunx: (
    <>
      <path d="M5 5 L 19 19" />
      <path d="M5 19 L 19 5" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
};

const AspectSigil: React.FC<Props> = ({
  aspect, size = 20, strokeWidth = 1.5, className, title,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={title ? "img" : "presentation"}
    aria-label={title}
    className={className}
  >
    {PATHS[aspect]}
  </svg>
);

export default AspectSigil;
