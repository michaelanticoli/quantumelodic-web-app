# Quantumelodic Web App

A monorepo containing the **Vite + React + TypeScript** frontend and the **Flask + Python** backend (engines) for the Quantumelodic platform.

---

## Repository layout

```
quantumelodic-web-app/
├── src/                   # Vite React TypeScript app (frontend)
│   ├── components/
│   ├── pages/
│   ├── lib/
│   │   └── apiClient.ts   # Typed HTTP client for the Flask backend
│   └── ...
├── backend/               # Flask Python backend
│   ├── api/
│   │   ├── main.py        # Flask app factory + all /api/* routes
│   │   └── email_service.py
│   ├── engines/
│   │   ├── ephemeris/     # Planetary position calculations
│   │   ├── ai_music/      # Chart → music parameter mapping
│   │   ├── harmonic/      # Overtone / frequency ratio calculations
│   │   └── midi/          # Music params → MIDI sequence
│   ├── requirements.txt
│   └── Procfile           # gunicorn start command (Render / Heroku)
├── supabase/              # Supabase edge functions & migrations
├── public/
├── package.json           # Root scripts (includes concurrently dev scripts)
├── vite.config.ts
└── .env.example           # Template for all environment variables
```

---

## Quick-start – local development

### Prerequisites
- **Node.js** ≥ 18 (or Bun)
- **Python** ≥ 3.11

### 1. Clone and install Node dependencies

```sh
git clone <repo-url>
cd quantumelodic-web-app
npm install
```

### 2. Set up the Python virtual environment

```sh
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 3. Configure environment variables

```sh
cp .env.example .env
# Edit .env and fill in your Supabase keys, Stripe keys, etc.
```

### 4. Run both services with one command

```sh
npm run dev
```

This uses [`concurrently`](https://github.com/open-cli-tools/concurrently) to start:
- **web** – Vite dev server on `http://localhost:8080`
- **api** – Flask dev server on `http://localhost:5001`

Vite is configured to proxy `/api/*` requests to the Flask backend, so you can call `fetch("/api/health")` from the frontend without worrying about CORS.

#### Run services individually

```sh
npm run dev:web   # Vite only
npm run dev:api   # Flask only
```

---

## Backend API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/health` | Health check |
| POST | `/api/calculate-chart` | Compute natal chart from birth data |
| POST | `/api/generate-music` | Map chart to Quantumelodic music params |
| POST | `/api/generate-midi` | Generate MIDI sequence data |
| POST | `/api/generate-planet-sound` | Cosmic frequency for a planet |
| POST | `/api/generate-aspect-sound` | Harmonic ratio for two planets |
| POST | `/api/create-checkout` | Create Stripe checkout session |
| POST | `/api/stripe-webhook` | Receive Stripe webhook events |
| POST | `/api/send-welcome-email` | Send a welcome email |

---

## Frontend API client

A small typed helper is available at `src/lib/apiClient.ts`:

```ts
import { apiClient } from "@/lib/apiClient";

// Check backend is reachable
const { status } = await apiClient.health();

// Calculate a natal chart
const chart = await apiClient.calculateChart({
  year: 1990, month: 6, day: 15,
  hour: 14, minute: 30,
  latitude: 40.7128, longitude: -74.0060,
  utc_offset: -5,
});

// Generate music params
const music = await apiClient.generateMusic({
  sunSign: chart.planets.find(p => p.name === "Sun")?.sign ?? "Leo",
  moonSign: chart.planets.find(p => p.name === "Moon")?.sign ?? "Cancer",
  planets: chart.planets,
  aspects: chart.aspects,
});
```

The base URL is read from `VITE_API_BASE_URL` (defaults to `http://localhost:5001`).

---

## Deployment

### Frontend (Vite)
Deploy the `dist/` build to any static host (Vercel, Netlify, Cloudflare Pages, etc.):
```sh
npm run build
```
Set `VITE_API_BASE_URL` to the deployed backend URL in your hosting platform's environment settings.

### Backend (Flask / gunicorn)
Deploy to [Render](https://render.com), [Fly.io](https://fly.io), [Railway](https://railway.app), or Heroku.

**Render example** – add a new *Web Service* pointing at this repo:
- **Build command:** `pip install -r backend/requirements.txt`
- **Start command:** `gunicorn --chdir backend "api.main:create_app()" --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
- **Environment variables:** set `STRIPE_*`, `FRONTEND_URL`, and email provider keys.

The `backend/Procfile` already contains the gunicorn start command for Heroku/Render auto-detection.

---

## Supabase Edge Functions & ElevenLabs Music Generation

The main song generation path calls the `generate-music` Supabase Edge Function, which contacts the ElevenLabs Music API and returns `audio/mpeg`. If ElevenLabs is unavailable or unconfigured, the frontend falls back to a local Tone.js offline render.

### Required Supabase Edge Function Secrets

In your **Supabase Dashboard → Project Settings → Edge Functions → Secrets**, add:

| Secret name | Description |
|-------------|-------------|
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key. Without this the function returns `{"unavailable":true}` and the app falls back to Tone.js. |

### Required Supabase Database Tables (for personalised prompts)

The `generate-music` function builds a rich, chart-specific music prompt by reading the QuantumMelodic translation tables. It tries the following table names **in order**, using the first that has rows:

| Data | Primary (preferred) | Fallback 1 | Fallback 2 |
|------|---------------------|------------|------------|
| Zodiac sign data | `qm_signs` | `zodiac_signs` | `zodiac signs` *(space in name, not recommended)* |
| Planet data | `qm_planets` | `planets` | — |
| Aspect data | `qm_aspects` | `aspects` | — |

**Recommendation:** rename your existing `zodiac signs` table to `zodiac_signs` to avoid the space in the identifier. The function will then pick it up automatically as a fallback.

The `X-QM-Enhanced` response header from the edge function indicates which data source was used:
- `qm-tables` — primary `qm_*` tables used (full personalisation)
- `fallback-tables` — fallback table names used (full personalisation)
- `fallback-prompt` — no table data found; generic sun/moon fallback prompt used

---



### Frontend
- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (auth + edge functions)

### Backend
- [Flask](https://flask.palletsprojects.com/) 3.x
- [flask-cors](https://flask-cors.readthedocs.io/)
- [gunicorn](https://gunicorn.org/) (production server)
- [Stripe](https://stripe.com/docs/api) Python SDK
- [pyswisseph](https://github.com/astrorigin/pyswisseph) (optional, for high-precision ephemeris)

