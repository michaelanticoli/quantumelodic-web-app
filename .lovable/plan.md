
# MoonTuner — UI/UX Modernization Plan

A focused, multi-pass redesign aimed at App Store / mobile readiness. Swedish minimalist: high-contrast black & white, generous whitespace, bold display typography, jewel-tone neon accents used as *punctuation* — not decoration. All zodiac and planetary symbols replaced by a single, hand-crafted SVG sigil set. No emojis. No clunky animations.

---

## 1. Design Language (foundation)

**Palette — `src/index.css`**
- Base: near-pure black `#0A0A0B` / off-white `#F5F4F1`
- Surfaces: layered grays at 4–10% lightness for dark, 92–98% for light
- One primary jewel-neon accent: **electric teal** `hsl(168 95% 55%)` (glow variant `hsl(168 100% 65%)`)
- Secondary jewel accents used sparingly per-context: amethyst `hsl(268 90% 62%)`, ember `hsl(14 95% 58%)`, citrine `hsl(48 100% 60%)`
- Strip out current purple-tinted darks and dual gold/teal split — single accent system

**Typography**
- Display: **Fraunces** (variable serif, optical sizing) for hero numerals & sign names — replaces Cormorant
- UI: **Inter Tight** for body & controls
- Mono: **JetBrains Mono** for coordinates/degrees
- Scale: large jumps (12, 14, 18, 32, 56, 96) — no mid-range mush
- Tracking: tight on display (-0.04em), wide on micro-labels (+0.18em uppercase)

**Motion**
- Remove: orbit spins, beam-scan, nebula drift, pulse-glow loops, shimmer
- Keep: 200ms ease-out fades, 400ms layout transitions, single hero entrance per page
- One signature motion: slow opacity/scale reveal on chart load

**Spacing & layout**
- 8pt grid, mobile-first
- Page max-width 720px on text views, full-bleed on chart
- Sticky bottom-safe-area nav (already exists — restyle, not rebuild)

---

## 2. Custom SVG Sigil Set

Single source of truth replaces every Unicode glyph / emoji / planet character in the app.

**New file:** `src/components/sigils/`
- `ZodiacSigil.tsx` — 12 signs, one component, `<ZodiacSigil sign="aries" size={48} />`
- `PlanetSigil.tsx` — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Chiron, Nodes
- `AspectSigil.tsx` — conjunction, opposition, trine, square, sextile, quincunx

Each sigil:
- 24×24 viewBox, drawn on a strict geometric grid
- 1.5px stroke, `currentColor`, round caps
- Optional `glow` prop adds an outer drop-shadow filter using `--accent`
- Designed in-file as path data (no external dependencies, no AI image gen needed)

Replaces all usage in: `ZodiacWheel`, `InteractiveZodiacWheel`, `PlanetDetailsTable`, `PlanetDetailPanel`, `AspectPatternPanel`, `QuantumMelodicSummary`, report templates.

---

## 3. Page-by-Page Pass

**Index (landing + reading flow)** — `src/pages/Index.tsx` is 923 lines; split into:
- `HeroPanel` (single H1 in Fraunces 96, one CTA)
- `ReadingShell` (chart + tabs)
- `BirthDataForm` (already separate; restyle inputs to underline-only, no boxes)

**ChartExplorer** — strip duplicate controls, give the wheel the full viewport, tools collapse into a single bottom sheet.

**Auth / ResetPassword** — single centered column, generous whitespace, no card chrome.

**About / Guide / Learn / Glossary / Academy / LunarReports** — unified editorial layout: large display heading, narrow measure body (65ch), sigils as section anchors.

**BottomNav** — switch to icon-only with sigils, active state = single neon underline, safe-area padding for iOS.

---

## 4. Components to Refresh

- `BirthDataForm` — underline inputs, no rounded boxes
- `PlanetDetailPanel` / `ZodiacSignDetailPanel` — sheet-style, full-bleed sigil header, two-column data
- `PlanetDetailsTable` — typographic table, no zebra rows, sigil + name + sign-relative degree
- `AspectPatternPanel` / `AspectLegend` — sigil-driven, no color-only encoding
- `QuantumMelodicSummary` — editorial layout, drop the dashboard feel
- `GeneratingState` / `LoadingAnimation.css` — replace scanline loader with a single thin progress line + Fraunces caption
- `CosmicBackground` / `AudioReactiveGradient` — keep audio reactivity, simplify to two-tone gradient

---

## 5. Mobile / App-Store Readiness

- iOS safe-area insets on nav + sheets (`env(safe-area-inset-*)`)
- Tap targets ≥ 44pt
- Add `apple-touch-icon`, themed `theme-color`, proper PWA manifest
- Lock viewport: `viewport-fit=cover`, no user-scaling on the chart
- Preload the two web fonts, subset to Latin
- Audit contrast to WCAG AA (especially neon-on-black)

---

## 6. Execution Order

```text
Pass 1  Tokens + fonts (index.css, tailwind.config.ts, index.html)
Pass 2  Sigil components (ZodiacSigil, PlanetSigil, AspectSigil)
Pass 3  Shared primitives (BottomNav, BirthDataForm, GeneratingState)
Pass 4  Chart surfaces (ZodiacWheel, InteractiveZodiacWheel, detail panels)
Pass 5  Page shells (Index split, ChartExplorer, Auth, editorial pages)
Pass 6  Mobile polish (safe areas, manifest, icons, contrast audit)
```

Each pass ships independently — preview stays usable throughout. No business logic, audio engine, ephemeris, or report wording changes.

---

## Technical Notes

- All colors via HSL semantic tokens; no hard-coded hex in components
- Sigils are plain React components (no runtime icon library) — keeps bundle small and ensures consistency
- Fonts loaded once in `index.html` via `<link rel="preload">` to avoid FOUT
- Removing animations cuts ~15 keyframe blocks from `index.css`
- No Supabase schema, edge function, or data-fetching changes

Approve and I'll start with Pass 1.
