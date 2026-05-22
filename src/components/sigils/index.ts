export { default as ZodiacSigil } from "./ZodiacSigil";
export type { ZodiacSign } from "./ZodiacSigil";
export { default as PlanetSigil } from "./PlanetSigil";
export type { PlanetName } from "./PlanetSigil";
export { default as AspectSigil } from "./AspectSigil";
export type { AspectName } from "./AspectSigil";

// Convenience normalizers — accept any casing or common alias.
import type { ZodiacSign } from "./ZodiacSigil";
import type { PlanetName } from "./PlanetSigil";

export const toZodiacSign = (s: string): ZodiacSign | null => {
  const k = s?.toLowerCase().trim();
  const valid: ZodiacSign[] = [
    "aries","taurus","gemini","cancer","leo","virgo",
    "libra","scorpio","sagittarius","capricorn","aquarius","pisces",
  ];
  return (valid as string[]).includes(k) ? (k as ZodiacSign) : null;
};

export const toPlanetName = (p: string): PlanetName | null => {
  const k = p?.toLowerCase().trim().replace(/\s+/g, "");
  const alias: Record<string, PlanetName> = {
    sun: "sun", moon: "moon", mercury: "mercury", venus: "venus", mars: "mars",
    jupiter: "jupiter", saturn: "saturn", uranus: "uranus", neptune: "neptune",
    pluto: "pluto", chiron: "chiron",
    northnode: "northnode", "north node": "northnode",
    truenode: "northnode", node: "northnode",
    southnode: "southnode", "south node": "southnode",
    asc: "ascendant", ascendant: "ascendant", rising: "ascendant",
    mc: "midheaven", midheaven: "midheaven",
  };
  return alias[k] ?? null;
};
