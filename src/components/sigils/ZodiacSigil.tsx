import React from "react";

export type ZodiacSign =
  | "aries" | "taurus" | "gemini" | "cancer"
  | "leo" | "virgo" | "libra" | "scorpio"
  | "sagittarius" | "capricorn" | "aquarius" | "pisces";

interface Props {
  sign: ZodiacSign;
  size?: number;
  strokeWidth?: number;
  glow?: boolean;
  className?: string;
  title?: string;
}

// Hand-drawn 24x24 geometric sigils — single source of truth.
const PATHS: Record<ZodiacSign, React.ReactNode> = {
  // Aries — the ram's horns
  aries: (
    <path d="M4 18 C 4 10, 8 6, 12 10 C 16 6, 20 10, 20 18" />
  ),
  // Taurus — circle + crescent
  taurus: (
    <>
      <circle cx="12" cy="15" r="5" />
      <path d="M5 7 C 7 11, 17 11, 19 7" />
    </>
  ),
  // Gemini — twin pillars
  gemini: (
    <>
      <path d="M5 5 H 19" />
      <path d="M5 19 H 19" />
      <path d="M8 5 V 19" />
      <path d="M16 5 V 19" />
    </>
  ),
  // Cancer — two interlocked circles
  cancer: (
    <>
      <path d="M4 9 A 5 3 0 0 1 14 9" />
      <circle cx="6" cy="11" r="1.5" />
      <path d="M20 15 A 5 3 0 0 1 10 15" />
      <circle cx="18" cy="13" r="1.5" />
    </>
  ),
  // Leo — lion's mane curl
  leo: (
    <>
      <circle cx="9" cy="11" r="4" />
      <path d="M13 11 C 16 11, 18 13, 18 16 C 18 19, 16 21, 14 19" />
    </>
  ),
  // Virgo — M with crossed tail
  virgo: (
    <>
      <path d="M4 6 V 18" />
      <path d="M4 6 L 8 14 L 12 6 V 18" />
      <path d="M12 6 L 16 14 V 18" />
      <path d="M16 18 C 19 18, 19 14, 16 14" />
      <path d="M14 16 L 19 21" />
    </>
  ),
  // Libra — balanced scales
  libra: (
    <>
      <path d="M4 19 H 20" />
      <path d="M4 15 H 20" />
      <path d="M8 15 C 8 11, 16 11, 16 15" />
    </>
  ),
  // Scorpio — M with arrow tail
  scorpio: (
    <>
      <path d="M4 6 V 18" />
      <path d="M4 6 L 8 14 L 12 6 V 18" />
      <path d="M12 6 L 16 14 V 20" />
      <path d="M16 20 L 21 15" />
      <path d="M21 15 L 18 15 M 21 15 L 21 18" />
    </>
  ),
  // Sagittarius — arrow
  sagittarius: (
    <>
      <path d="M5 19 L 19 5" />
      <path d="M19 5 L 13 5 M 19 5 L 19 11" />
      <path d="M9 11 L 13 15" />
    </>
  ),
  // Capricorn — V with curl
  capricorn: (
    <>
      <path d="M4 6 L 9 16 L 14 6" />
      <path d="M14 6 V 14" />
      <path d="M14 14 A 3 3 0 1 1 18 16 A 2 2 0 1 0 14 16" />
    </>
  ),
  // Aquarius — two wave lines
  aquarius: (
    <>
      <path d="M4 9 L 7 7 L 10 9 L 13 7 L 16 9 L 19 7 L 20 7.5" />
      <path d="M4 15 L 7 13 L 10 15 L 13 13 L 16 15 L 19 13 L 20 13.5" />
    </>
  ),
  // Pisces — two crescents bound
  pisces: (
    <>
      <path d="M5 5 C 9 9, 9 15, 5 19" />
      <path d="M19 5 C 15 9, 15 15, 19 19" />
      <path d="M5 12 H 19" />
    </>
  ),
};

const ZodiacSigil: React.FC<Props> = ({
  sign, size = 24, strokeWidth = 1.5, glow = false, className, title,
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
      style={glow ? { filter: `url(#sigil-glow-${id})` } : undefined}
    >
      {glow && (
        <defs>
          <filter id={`sigil-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      {PATHS[sign]}
    </svg>
  );
};

export default ZodiacSigil;
