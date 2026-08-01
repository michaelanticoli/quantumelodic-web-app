# Sample compositions on the landing page

Right now the landing page lists one sample, `Albert Einstein`, pointing at `/samples/einstein.mp3` — a file that does not exist in the project, so that card fails to play. The only real audio in the repo is `public/sample-composition.mp3` (2.1 MB), used by the Astro-Harmonic page.

The two uploaded tracks fill the gap:

- `Moontuner_s_Debut_1.mp3` (4.6 MB) — becomes the Albert Einstein sample
- `Moontuner_s_Debut_Lite.mp3` (1.8 MB) — becomes a second named sample

## What changes

1. Upload both MP3s to the CDN as assets (keeps the repo light, same delivery as the rest of the media).
2. Rewire the samples list on the landing page to three cards:
   - **Albert Einstein** — Pisces Sun · Sagittarius Moon — E♭ Major · Lydian — Debut 1
   - **Frida Kahlo** — Cancer Sun · Taurus Moon — B Minor · Aeolian — Debut Lite
   - **Nikola Tesla** — Cancer Sun · Sagittarius Moon — A Minor · Dorian — existing `sample-composition.mp3`
   (Names, chart lines and keys are placeholders matching the existing card format — tell me the real ones and I'll swap them in.)
3. Update the section heading from "LISTEN — ONE CHART" to "LISTEN — THREE CHARTS", and keep the copy that each chart sounds different because the process is identical to what a buyer receives.
4. Leave the Astro-Harmonic page's single sample as-is (it keeps pointing at the same track used for the third card).

## Technical notes

- Assets created with `lovable-assets create` into `src/assets/*.mp3.asset.json`; `SAMPLES` in `src/pages/Index.tsx` imports the pointers and uses `.url` for `src`.
- `SampleCard` already handles play/pause, error fallback and `preload="none"`, so no component changes are needed.
- No backend, pricing, or funnel logic is touched.
