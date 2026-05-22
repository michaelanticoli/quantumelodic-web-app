import React from "react";

export type PlanetName =
  | "sun" | "moon" | "mercury" | "venus" | "mars"
  | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto"
  | "chiron" | "northnode" | "southnode" | "ascendant" | "midheaven";

interface Props {
  planet: PlanetName;
  size?: number;
  strokeWidth?: number;
  glow?: boolean;
  className?: string;
  title?: string;
}

const PATHS: Record<PlanetName, React.ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  moon: (
    <path d="M16 4 A 8 8 0 1 0 16 20 A 6 6 0 1 1 16 4 Z" />
  ),
  mercury: (
    <>
      <path d="M7 4 A 5 5 0 0 0 17 4" />
      <circle cx="12" cy="10" r="3.5" />
      <path d="M12 13.5 V 19" />
      <path d="M9 17 H 15" />
    </>
  ),
  venus: (
    <>
      <circle cx="12" cy="9" r="4.5" />
      <path d="M12 13.5 V 21" />
      <path d="M9 18 H 15" />
    </>
  ),
  mars: (
    <>
      <circle cx="10" cy="14" r="4.5" />
      <path d="M13.2 10.8 L 20 4" />
      <path d="M14 4 H 20 V 10" />
    </>
  ),
  jupiter: (
    <>
      <path d="M5 8 H 14" />
      <path d="M9 4 V 16 C 9 19, 13 19, 13 16" />
      <path d="M19 4 V 20" transform="translate(-5 0)" />
    </>
  ),
  saturn: (
    <>
      <path d="M6 4 H 13" />
      <path d="M9 4 V 16 C 9 18, 11 18, 12 16" />
      <path d="M14 12 A 3 3 0 1 0 18 16" />
    </>
  ),
  uranus: (
    <>
      <path d="M6 4 V 12" />
      <path d="M18 4 V 12" />
      <path d="M6 8 H 18" />
      <path d="M12 8 V 16" />
      <circle cx="12" cy="19" r="2" />
    </>
  ),
  neptune: (
    <>
      <path d="M6 6 C 6 12, 10 14, 12 14 C 14 14, 18 12, 18 6" />
      <path d="M12 6 V 20" />
      <path d="M8 18 H 16" />
    </>
  ),
  pluto: (
    <>
      <path d="M7 14 V 20" />
      <path d="M4 17 H 10" />
      <circle cx="13" cy="10" r="3" />
      <path d="M13 4 C 17 4, 19 7, 19 10 C 19 13, 17 16, 13 16" />
    </>
  ),
  chiron: (
    <>
      <circle cx="12" cy="16" r="4" />
      <path d="M12 12 V 4" />
      <path d="M12 4 C 16 4, 17 8, 14 9" />
    </>
  ),
  northnode: (
    <path d="M6 18 C 6 8, 12 4, 14 11 C 16 18, 22 14, 22 6" />
  ),
  southnode: (
    <path d="M6 6 C 6 16, 12 20, 14 13 C 16 6, 22 10, 22 18" />
  ),
  ascendant: (
    <>
      <path d="M4 20 L 12 4 L 20 20" />
      <path d="M7 14 H 17" />
    </>
  ),
  midheaven: (
    <>
      <path d="M4 20 V 4 L 12 14 L 20 4 V 20" />
    </>
  ),
};

const PlanetSigil: React.FC<Props> = ({
  planet, size = 24, strokeWidth = 1.5, glow = false, className, title,
}) => {
  const id = React.useId();
  return (
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
      style={glow ? { filter: `url(#planet-glow-${id})` } : undefined}
    >
      {glow && (
        <defs>
          <filter id={`planet-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      )}
      {PATHS[planet]}
    </svg>
  );
};

export default PlanetSigil;
