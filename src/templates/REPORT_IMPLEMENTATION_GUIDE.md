# MOONtuner Report Templates — Implementation Guide

## What you now have

Three print-ready HTML report templates:

| File | Product | Price |
|---|---|---|
| `phasecraft-pocket-guide.html` | Free lead generator | $0 |
| `lunar-arc-report.html` | Lunar Arc Report | $25 |
| `natal-harmonic-analysis.html` | Astro-Harmonic Natal Analysis | $47 |

---

## Where these files live in the repo

```
moon-tuner/
  src/
    templates/                     ← CREATE THIS FOLDER
      phasecraft-pocket-guide.html
      lunar-arc-report.html
      natal-harmonic-analysis.html
  public/
    (leave as-is)
```

---

## Implementation Options — Choose One

### Option A: React Component + Browser Print (Recommended for MVP)

**How it works:**
Convert each HTML template into a React component. User clicks "Download Report" → component renders with their data → they print to PDF via Ctrl+P / Cmd+P.

**Pros:** No server dependencies, works with Lovable, free, fast to implement.
**Cons:** User has to manually print to PDF (one extra step).

**Steps:**

1. Create `src/components/reports/LunarArcReport.tsx`
2. Convert the HTML template into JSX, replacing hardcoded values with props:

```tsx
// src/components/reports/LunarArcReport.tsx

interface LunarArcReportProps {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  phaseName: string;
  phaseDegree: number;
  archetype: string;
  element: string;
  modality: string;
  solfeggio: string;
  solfeggioDesc: string;
  somaticZone: string;
  keywords: string[];
  peakDays: Array<{
    date: string;
    type: 'peak' | 'eclipse';
    description: string;
    amplitude: number;
  }>;
  generatedDate: string;
}

export function LunarArcReport(props: LunarArcReportProps) {
  // Return JSX equivalent of the HTML template
  // with props.name, props.phaseName, etc. replacing hardcoded values
}
```

3. Add a print trigger in your purchase/download flow:

```tsx
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { LunarArcReport } from '@/components/reports/LunarArcReport';

function DownloadReportButton({ reportData }) {
  const reportRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Lunar-Arc-Report-${reportData.name}`,
  });

  return (
    <>
      <button onClick={handlePrint}>Download Your Report</button>
      <div style={{ display: 'none' }}>
        <div ref={reportRef}>
          <LunarArcReport {...reportData} />
        </div>
      </div>
    </>
  );
}
```

4. Install the print library:
```bash
npm install react-to-print
```

---

### Option B: Supabase Edge Function → PDF (Best for Automated Delivery)

**How it works:**
A Supabase edge function receives user chart data, injects it into the HTML template, uses a headless browser to render a proper PDF, and returns it as a download or email attachment.

**Pros:** Fully automated, professional PDF output, can email on purchase.
**Cons:** Requires Browserless.io account (~$10/month after free tier).

**Steps:**

1. Create the edge function folder:

```
supabase/
  functions/
    generate-report/
      index.ts
      templates/
        lunar-arc-report.html   ← copy template here with {{PLACEHOLDERS}}
```

2. Edge function code:

```typescript
// supabase/functions/generate-report/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { reportType, userData } = await req.json();

  const template = await Deno.readTextFile(
    `./templates/${reportType}.html`
  );

  // Inject user data via string replacement
  const populated = template
    .replace(/{{NAME}}/g, userData.name)
    .replace(/{{BIRTH_DATE_TIME}}/g, userData.birthDateTime)
    .replace(/{{PHASE_NAME}}/g, userData.phaseName)
    .replace(/{{PHASE_DEGREE}}/g, userData.phaseDegree)
    .replace(/{{ARCHETYPE}}/g, userData.archetype)
    .replace(/{{MUSICAL_MODE}}/g, userData.musicalMode)
    .replace(/{{GENERATED_DATE}}/g, new Date().toLocaleDateString());

  // Call Browserless.io to render PDF
  const pdfResponse = await fetch('https://chrome.browserless.io/pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('BROWSERLESS_TOKEN')}`,
    },
    body: JSON.stringify({
      html: populated,
      options: {
        printBackground: true,
        format: 'Letter',
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      },
    }),
  });

  const pdfBuffer = await pdfResponse.arrayBuffer();

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${userData.name}.pdf"`,
    },
  });
});
```

3. Browserless.io free tier: 500 sessions/month. Sufficient for MVP.

---

### Option C: Static File + URL Params (Quickest Demo)

**How it works:**
Host the HTML files in `public/`. A JS snippet on page load reads URL params and injects them into the DOM.

**Good for:** Client demos, investor previews.
**Not for:** Production — data is visible in the URL.

---

## Recommended Path for Your Stack

Given **Lovable + React + Vite + Supabase + Netlify**:

**Phase 1 (This week) — Option A**
Get reports working with `react-to-print`. Estimated: 2–3 hours.
- Convert HTML to JSX (mechanical find/replace)
- Wire up the print button in your purchase success flow
- Test print-to-PDF in Chrome

**Phase 2 (Next sprint) — Option B**
When volume justifies it, move to Supabase edge function + Browserless for
automated PDF delivery on purchase.

---

## Template Placeholders to Add

Before converting to React components, add these placeholders to each HTML file. These mark every value that will come from user data.

### Lunar Arc Report

| Hardcoded value | Placeholder |
|---|---|
| `Michael` (name) | `{{NAME}}` |
| `1985-04-24 at 12:55` | `{{BIRTH_DATE_TIME}}` |
| `NYC` | `{{BIRTH_PLACE}}` |
| `Waxing Crescent` (phase name) | `{{PHASE_NAME}}` |
| `47.58°` | `{{PHASE_DEGREE}}` |
| `The Sprout / The Pioneer` | `{{ARCHETYPE}}` |
| `Earth Rising` | `{{ELEMENT}}` |
| `Fixed Emergence` | `{{MODALITY}}` |
| `Throat · Voice` | `{{SOMATIC_ZONE}}` |
| `417 Hz` | `{{SOLFEGGIO_HZ}}` |
| `Facilitating change` | `{{SOLFEGGIO_DESC}}` |
| `April 7, 2026` (generated date) | `{{GENERATED_DATE}}` |
| Each peak date row | Dynamic — loop from `{{PEAK_DAYS}}` array |
| Archetype description paragraph | `{{ARCHETYPE_DESC}}` |
| Keyword pills | Dynamic — loop from `{{KEYWORDS}}` array |

### Natal Harmonic Analysis

| Hardcoded value | Placeholder |
|---|---|
| `micahel's Cosmic Chart` | `{{NAME}}'s Cosmic Chart` |
| `Taurus` (Sun sign) | `{{SUN_SIGN}}` |
| `Gemini` (Moon sign) | `{{MOON_SIGN}}` |
| `Scorpio` (Ascendant) | `{{ASCENDANT}}` |
| `34°46'` (Sun degree) | `{{SUN_DEGREE}}` |
| `87°40'` (Moon degree) | `{{MOON_DEGREE}}` |
| `229°22'` (ASC degree) | `{{ASC_DEGREE}}` |
| `F Ionian` (musical mode) | `{{MUSICAL_MODE}}` |
| `1985-04-24 at 19:55` | `{{BIRTH_DATE_TIME}}` |
| `New York City` | `{{BIRTH_PLACE}}` |
| Each planet row | Dynamic — loop from `{{PLANETS}}` array |
| Each musical voice row | Dynamic — loop from `{{PLANETS}}` array |
| Composition narrative paragraphs | `{{COMPOSITION_NARRATIVE}}` |

### Phasecraft Pocket Guide

No user-specific data — serve as a static PDF. Generate it once by printing the HTML to PDF in Chrome, then host it at:
```
public/phasecraft-pocket-guide.pdf
```
Gate it behind an email capture form. No Stripe required.

---

## Folder Structure After Implementation

```
moon-tuner/
  src/
    components/
      reports/
        LunarArcReport.tsx           ← $25 report component
        NatalHarmonicAnalysis.tsx    ← $47 report component
        PhasecraftGuide.tsx          ← Free (optional — may not need this)
        index.ts                     ← export { LunarArcReport, NatalHarmonicAnalysis }
    lib/
      lunarHarmonicEngine.ts         ← Already built
    data/
      baseTonics.json                ← Already exists
      harmonicWisdom.ts              ← Already exists
      mergedHouses.json              ← Already exists
    templates/
      lunar-arc-report.html          ← Master template (with placeholders)
      natal-harmonic-analysis.html   ← Master template (with placeholders)
  supabase/
    functions/
      calculate-chart/               ← Already exists
      generate-report/               ← Add in Phase 2
  public/
    phasecraft-pocket-guide.pdf      ← Static file, generated once
```

---

## Handing to Lovable

When working in Lovable, the cleanest approach is:

1. Open Lovable
2. Paste the full JSX component code in the chat with this prompt:

> "Add this as a new file at `src/components/reports/LunarArcReport.tsx`. Do not modify the layout or CSS. The component should accept a `LunarArcReportProps` interface. Wire it to the existing purchase success page so it renders when a user completes a $25 Stripe payment and a 'Download Report' button triggers `window.print()`."

Lovable handles "add this component" instructions well when given complete code. Avoid asking it to design the report from scratch — provide the full component and ask it only to wire it up.

---

## Print-to-PDF Instructions for Users

Add this note to the report delivery page:

> **To save your report as PDF:**
> 1. Click "Open Report"
> 2. Press **Cmd+P** (Mac) or **Ctrl+P** (Windows)
> 3. Select **Save as PDF** as your printer
> 4. Set margins to **None**
> 5. Enable **Background graphics**
> 6. Click Save

This produces a PDF indistinguishable from a server-rendered one.
