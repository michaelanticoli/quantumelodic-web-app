"""
Quantumelodic Flask API – main entrypoint.

Exposes /api/* endpoints consumed by the Vite frontend (or any HTTP client).

Run locally:
    python -m flask --app backend/api/main run --port 5001

or via gunicorn (see backend/Procfile):
    gunicorn --chdir backend "api.main:create_app()"
"""

from __future__ import annotations

import json
import logging
import math
import os
import re
import sys

# ---------------------------------------------------------------------------
# Ensure the backend package root is on sys.path so that
#   from engines.ephemeris.chart_builder import build_chart
# works whether the module is run directly or via gunicorn.
# ---------------------------------------------------------------------------
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from flask import Flask, jsonify, request  # noqa: E402
from flask_cors import CORS  # noqa: E402

from api.email_service import send_welcome_email  # noqa: E402
from engines.ephemeris.chart_builder import build_chart  # noqa: E402
from engines.ai_music.music_generator import generate_music_params  # noqa: E402
from engines.harmonic.harmonic_series import compute_harmonics, frequency_for_planet  # noqa: E402
from engines.midi.midi_builder import build_midi_sequence  # noqa: E402

# ---------------------------------------------------------------------------
# Stripe (optional – only imported when keys are present)
# ---------------------------------------------------------------------------
try:
    import stripe  # type: ignore

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
    _STRIPE_AVAILABLE = bool(stripe.api_key)
except ImportError:
    stripe = None  # type: ignore
    _STRIPE_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_TIME_RE = re.compile(r"^\d{2}:\d{2}$")
_NYC_FALLBACK_LAT = 40.7128
_NYC_FALLBACK_LON = -74.0060
_NYC_FALLBACK_UTC_OFFSET = -5.0


def _sanitize_location(value: str) -> str:
    return re.sub(r"[<>\"'&;]", "", value).strip()[:200]


def _utc_offset_from_longitude(longitude: float) -> int:
    return int(math.floor((longitude / 15.0) + 0.5))


def _geocode_location(location: str) -> tuple[float, float, float]:
    import requests

    sanitized = _sanitize_location(location)
    if len(sanitized) < 2:
        raise ValueError("Location must be at least 2 characters")

    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"format": "json", "q": sanitized, "limit": 1},
            headers={"User-Agent": "Quantumelodic/1.0 (chart calculation fallback)"},
            timeout=10,
        )
        response.raise_for_status()
        results = response.json()
    except requests.RequestException as exc:
        logger.warning("Geocoding lookup failed for %s; using NYC fallback: %s", sanitized, exc)
        return _NYC_FALLBACK_LAT, _NYC_FALLBACK_LON, _NYC_FALLBACK_UTC_OFFSET

    if not results:
        return _NYC_FALLBACK_LAT, _NYC_FALLBACK_LON, _NYC_FALLBACK_UTC_OFFSET

    latitude = float(results[0]["lat"])
    longitude = float(results[0]["lon"])
    utc_offset = _utc_offset_from_longitude(longitude)
    return latitude, longitude, utc_offset


def _coerce_frontend_birth_payload(data: dict[str, object]) -> dict[str, object]:
    if all(key in data for key in ("year", "month", "day", "hour", "minute", "latitude", "longitude")):
        return data

    date = str(data.get("date", "")).strip()
    time = str(data.get("time", "")).strip()
    if not _DATE_RE.match(date):
        raise ValueError("Invalid date format. Use YYYY-MM-DD")
    if not _TIME_RE.match(time):
        raise ValueError("Invalid time format. Use HH:MM")

    year, month, day = [int(part) for part in date.split("-")]
    hour, minute = [int(part) for part in time.split(":")]

    latitude = data.get("latitude")
    longitude = data.get("longitude")
    utc_offset = data.get("utc_offset", data.get("timezone"))

    if latitude is None or longitude is None:
        location = data.get("location")
        if not isinstance(location, str):
            raise ValueError("Location or coordinates required")
        latitude, longitude, utc_offset = _geocode_location(location)

    return {
        **data,
        "year": year,
        "month": month,
        "day": day,
        "hour": hour,
        "minute": minute,
        "latitude": float(latitude),
        "longitude": float(longitude),
        "utc_offset": float(0 if utc_offset is None else utc_offset),
    }


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


def create_app() -> Flask:
    app = Flask(__name__)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080")
    CORS(
        app,
        origins=[frontend_url, "http://localhost:8080", "http://localhost:3000"],
        supports_credentials=True,
    )

    # ------------------------------------------------------------------ #
    #  Health                                                              #
    # ------------------------------------------------------------------ #

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "quantumelodic-api"})

    # ------------------------------------------------------------------ #
    #  Chart calculation                                                   #
    # ------------------------------------------------------------------ #

    @app.route("/api/calculate-chart", methods=["POST"])
    def calculate_chart():
        data = request.get_json(force=True, silent=True) or {}

        try:
            data = _coerce_frontend_birth_payload(data)
        except ValueError:
            return jsonify({"error": "Invalid birth data provided"}), 400

        required = ("year", "month", "day", "hour", "minute", "latitude", "longitude")
        missing = [k for k in required if k not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        try:
            result = build_chart(
                year=int(data["year"]),
                month=int(data["month"]),
                day=int(data["day"]),
                hour=int(data["hour"]),
                minute=int(data["minute"]),
                latitude=float(data["latitude"]),
                longitude=float(data["longitude"]),
                utc_offset=float(data.get("utc_offset", 0)),
            )
            return jsonify(result)
        except (ValueError, TypeError) as exc:
            return jsonify({"error": str(exc)}), 400
        except Exception as exc:
            logger.exception("calculate-chart error")
            return jsonify({"error": "Internal server error"}), 500

    # ------------------------------------------------------------------ #
    #  Music generation                                                    #
    # ------------------------------------------------------------------ #

    @app.route("/api/generate-music", methods=["POST"])
    def generate_music():
        data = request.get_json(force=True, silent=True) or {}

        sun_sign = data.get("sunSign", "")
        moon_sign = data.get("moonSign", "")

        if not sun_sign or not moon_sign:
            return jsonify({"error": "sunSign and moonSign are required"}), 400

        try:
            params = generate_music_params(
                sun_sign=sun_sign,
                moon_sign=moon_sign,
                ascendant=data.get("ascendant"),
                planets=data.get("planets"),
                aspects=data.get("aspects"),
            )
            return jsonify(params)
        except Exception as exc:
            logger.exception("generate-music error")
            return jsonify({"error": "Internal server error"}), 500

    # ------------------------------------------------------------------ #
    #  MIDI sequence                                                       #
    # ------------------------------------------------------------------ #

    @app.route("/api/generate-midi", methods=["POST"])
    def generate_midi():
        data = request.get_json(force=True, silent=True) or {}

        if "musicParams" not in data:
            return jsonify({"error": "musicParams is required"}), 400

        try:
            midi_seq = build_midi_sequence(
                music_params=data["musicParams"],
                bars=int(data.get("bars", 8)),
            )
            return jsonify(midi_seq)
        except Exception as exc:
            logger.exception("generate-midi error")
            return jsonify({"error": "Internal server error"}), 500

    # ------------------------------------------------------------------ #
    #  Planet sound                                                        #
    # ------------------------------------------------------------------ #

    @app.route("/api/generate-planet-sound", methods=["POST"])
    def generate_planet_sound():
        data = request.get_json(force=True, silent=True) or {}
        planet = data.get("planet", "Sun")
        octave_shift = int(data.get("octaveShift", 0))
        num_harmonics = int(data.get("numHarmonics", 8))

        try:
            freq = frequency_for_planet(planet, octave_shift)
            harmonics = compute_harmonics(freq, num_harmonics)
            return jsonify({"planet": planet, "frequency_hz": freq, **harmonics})
        except Exception as exc:
            logger.exception("generate-planet-sound error")
            return jsonify({"error": "Internal server error"}), 500

    # ------------------------------------------------------------------ #
    #  Aspect sound                                                        #
    # ------------------------------------------------------------------ #

    @app.route("/api/generate-aspect-sound", methods=["POST"])
    def generate_aspect_sound():
        data = request.get_json(force=True, silent=True) or {}
        planet1 = data.get("planet1", "Sun")
        planet2 = data.get("planet2", "Moon")

        try:
            freq1 = frequency_for_planet(planet1)
            freq2 = frequency_for_planet(planet2)

            # Ratio between the two frequencies
            ratio = freq2 / freq1 if freq1 else 1.0
            # Cents difference
            cents = 1200 * math.log2(ratio) if ratio > 0 else 0

            return jsonify({
                "planet1": {"name": planet1, "frequency_hz": freq1},
                "planet2": {"name": planet2, "frequency_hz": freq2},
                "ratio": round(ratio, 6),
                "cents": round(cents, 2),
            })
        except Exception as exc:
            logger.exception("generate-aspect-sound error")
            return jsonify({"error": "Internal server error"}), 500

    # ------------------------------------------------------------------ #
    #  Stripe – create checkout session                                    #
    # ------------------------------------------------------------------ #

    @app.route("/api/create-checkout", methods=["POST"])
    def create_checkout():
        if not _STRIPE_AVAILABLE:
            return jsonify({"error": "Stripe is not configured"}), 503

        data = request.get_json(force=True, silent=True) or {}
        customer_email = data.get("email")

        if not customer_email:
            return jsonify({"error": "email is required"}), 400

        price_id = os.getenv("STRIPE_PRO_PRICE_ID")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080")

        try:
            session = stripe.checkout.Session.create(
                customer_email=customer_email,
                payment_method_types=["card"],
                line_items=[{"price": price_id, "quantity": 1}],
                mode="subscription",
                success_url=f"{frontend_url}/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{frontend_url}/pricing",
            )
            return jsonify({"url": session.url})
        except stripe.error.StripeError as exc:
            logger.error("Stripe error: %s", exc)
            return jsonify({"error": str(exc)}), 400
        except Exception:
            logger.exception("create-checkout error")
            return jsonify({"error": "Internal server error"}), 500

    # ------------------------------------------------------------------ #
    #  Stripe – webhook                                                    #
    # ------------------------------------------------------------------ #

    @app.route("/api/stripe-webhook", methods=["POST"])
    def stripe_webhook():
        if not _STRIPE_AVAILABLE:
            return jsonify({"error": "Stripe is not configured"}), 503

        payload = request.get_data()
        sig_header = request.headers.get("Stripe-Signature")
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except (ValueError, stripe.error.SignatureVerificationError) as exc:
            logger.warning("Stripe webhook invalid: %s", exc)
            return jsonify({"error": "Invalid signature"}), 400

        event_type = event.get("type")
        logger.info("Stripe webhook received: %s", event_type)

        if event_type == "checkout.session.completed":
            session_obj = event["data"]["object"]
            customer_email = session_obj.get("customer_email")
            customer_name = (
                (session_obj.get("customer_details") or {}).get("name")
                or (customer_email.split("@")[0] if customer_email else "")
            )
            if customer_email:
                send_welcome_email(customer_email, customer_name)

        return jsonify({"received": True})

    # ------------------------------------------------------------------ #
    #  Email                                                               #
    # ------------------------------------------------------------------ #

    @app.route("/api/send-welcome-email", methods=["POST"])
    def send_welcome():
        data = request.get_json(force=True, silent=True) or {}
        to = data.get("email")
        name = data.get("name", "")

        if not to:
            return jsonify({"error": "email is required"}), 400

        success = send_welcome_email(to, name)
        if success:
            return jsonify({"sent": True})
        return jsonify({"error": "Failed to send email"}), 500

    return app


# ---------------------------------------------------------------------------
# Dev entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
