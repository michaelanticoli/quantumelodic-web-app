// Inline SVG fragment helpers — used INSIDE an existing <svg> in chart components.
// They return a <g> centered at (cx, cy), rendering the same sigil paths as the
// top-level sigil components.

import React from "react";
import type { ZodiacSign } from "./ZodiacSigil";
import type { PlanetName } from "./PlanetSigil";

// 24x24 path geometry — duplicated minimally for inline reuse.
const ZODIAC: Record<ZodiacSign, React.ReactNode> = {
  aries: <path d="M4 18 C 4 10, 8 6, 12 10 C 16 6, 20 10, 20 18" />,
  taurus: (
    <>
      <circle cx="12" cy="15" r="5" />
      <path d="M5 7 C 7 11, 17 11, 19 7" />
    </>
  ),
  gemini: (
    <>
      <path d="M5 5 H 19" />
      <path d="M5 19 H 19" />
      <path d="M8 5 V 19" />
      <path d="M16 5 V 19" />
    </>
  ),
  cancer: (
    <>
      <path d="M4 9 A 5 3 0 0 1 14 9" />
      <circle cx="6" cy="11" r="1.5" />
      <path d="M20 15 A 5 3 0 0 1 10 15" />
      <circle cx="18" cy="13" r="1.5" />
    </>
  ),
  leo: (
    <>
      <circle cx="9" cy="11" r="4" />
      <path d="M13 11 C 16 11, 18 13, 18 16 C 18 19, 16 21, 14 19" />
    </>
  ),
  virgo: (
    <>
      <path d="M4 6 V 18" />
      <path d="M4 6 L 8 14 L 12 6 V 18" />
      <path d="M12 6 L 16 14 V 18" />
      <path d="M16 18 C 19 18, 19 14, 16 14" />
      <path d="M14 16 L 19 21" />
    </>
  ),
  libra: (
    <>
      <path d="M4 19 H 20" />
      <path d="M4 15 H 20" />
      <path d="M8 15 C 8 11, 16 11, 16 15" />
    </>
  ),
  scorpio: (
    <>
      <path d="M4 6 V 18" />
      <path d="M4 6 L 8 14 L 12 6 V 18" />
      <path d="M12 6 L 16 14 V 20" />
      <path d="M16 20 L 21 15" />
      <path d="M21 15 L 18 15 M 21 15 L 21 18" />
    </>
  ),
  sagittarius: (
    <>
      <path d="M5 19 L 19 5" />
      <path d="M19 5 L 13 5 M 19 5 L 19 11" />
      <path d="M9 11 L 13 15" />
    </>
  ),
  capricorn: (
    <>
      <path d="M4 6 L 9 16 L 14 6" />
      <path d="M14 6 V 14" />
      <path d="M14 14 A 3 3 0 1 1 18 16 A 2 2 0 1 0 14 16" />
    </>
  ),
  aquarius: (
    <>
      <path d="M4 9 L 7 7 L 10 9 L 13 7 L 16 9 L 19 7 L 20 7.5" />
      <path d="M4 15 L 7 13 L 10 15 L 13 13 L 16 15 L 19 13 L 20 13.5" />
    </>
  ),
  pisces: (
    <>
      <path d="M5 5 C 9 9, 9 15, 5 19" />
      <path d="M19 5 C 15 9, 15 15, 19 19" />
      <path d="M5 12 H 19" />
    </>
  ),
};

const PLANET: Record<PlanetName, React.ReactNode> = {
  sun: (<><circle cx="12" cy="12" r="5.5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /></>),
  moon: <path d="M16 4 A 8 8 0 1 0 16 20 A 6 6 0 1 1 16 4 Z" />,
  mercury: (<><path d="M7 4 A 5 5 0 0 0 17 4" /><circle cx="12" cy="10" r="3.5" /><path d="M12 13.5 V 19" /><path d="M9 17 H 15" /></>),
  venus: (<><circle cx="12" cy="9" r="4.5" /><path d="M12 13.5 V 21" /><path d="M9 18 H 15" /></>),
  mars: (<><circle cx="10" cy="14" r="4.5" /><path d="M13.2 10.8 L 20 4" /><path d="M14 4 H 20 V 10" /></>),
  jupiter: (<><path d="M4 8 H 14" /><path d="M9 4 V 16 C 9 19, 13 19, 13 16" /><path d="M14 4 V 20" /></>),
  saturn: (<><path d="M6 4 H 13" /><path d="M9 4 V 16 C 9 18, 11 18, 12 16" /><path d="M14 12 A 3 3 0 1 0 18 16" /></>),
  uranus: (<><path d="M6 4 V 12" /><path d="M18 4 V 12" /><path d="M6 8 H 18" /><path d="M12 8 V 16" /><circle cx="12" cy="19" r="2" /></>),
  neptune: (<><path d="M6 6 C 6 12, 10 14, 12 14 C 14 14, 18 12, 18 6" /><path d="M12 6 V 20" /><path d="M8 18 H 16" /></>),
  pluto: (<><path d="M7 14 V 20" /><path d="M4 17 H 10" /><circle cx="13" cy="10" r="3" /><path d="M13 4 C 17 4, 19 7, 19 10 C 19 13, 17 16, 13 16" /></>),
  chiron: (<><circle cx="12" cy="16" r="4" /><path d="M12 12 V 4" /><path d="M12 4 C 16 4, 17 8, 14 9" /></>),
  northnode: <path d="M6 18 C 6 8, 12 4, 14 11 C 16 18, 22 14, 22 6" />,
  southnode: <path d="M6 6 C 6 16, 12 20, 14 13 C 16 6, 22 10, 22 18" />,
  ascendant: (<><path d="M4 20 L 12 4 L 20 20" /><path d="M7 14 H 17" /></>),
  midheaven: <path d="M4 20 V 4 L 12 14 L 20 4 V 20" />,
};

interface FragmentProps {
  cx: number;
  cy: number;
  size: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  filter?: string;
}

// Renders a sigil at (cx, cy) sized to `size` px (viewBox is 24).
export const ZodiacSigilFragment: React.FC<FragmentProps & { sign: ZodiacSign }> = ({
  cx, cy, size, sign, stroke = "currentColor", strokeWidth = 1.5, opacity = 1, filter,
}) => {
  const s = size / 24;
  return (
    <g
      transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${s})`}
      stroke={stroke}
      fill="none"
      strokeWidth={strokeWidth / s}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      filter={filter}
    >
      {ZODIAC[sign]}
    </g>
  );
};

export const PlanetSigilFragment: React.FC<FragmentProps & { planet: PlanetName }> = ({
  cx, cy, size, planet, stroke = "currentColor", strokeWidth = 1.5, opacity = 1, filter,
}) => {
  const s = size / 24;
  return (
    <g
      transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${s})`}
      stroke={stroke}
      fill="none"
      strokeWidth={strokeWidth / s}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      filter={filter}
    >
      {PLANET[planet]}
    </g>
  );
};
