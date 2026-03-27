#!/usr/bin/env python3
"""
Envoie les mesures des capteurs vers ton site (POST /api/sensor).

URL typique : https://qualitedelair.onrender.com

Variables (fichier .env à côté de ce script, ou export dans le shell) :
  API_URL          URL HTTPS sans slash final (obligatoire)
  SENSOR_API_KEY   Même valeur que sur Render (variable SENSOR_API_KEY), si tu l’as définie
  INTERVAL_SEC     Intervalle entre envois (défaut 5)
  MOCK_MODE        1 = données simulées (test sans matériel)

Usage :
  python3 pi_sensor_sender.py              # boucle infinie
  python3 pi_sensor_sender.py --once       # un seul envoi
"""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import sys
import time
from typing import Any, Dict

import requests

# ---------------------------------------------------------------------------
# Imports optionnels selon ton matériel (décommenter après pip install)
# ---------------------------------------------------------------------------
# import Adafruit_DHT  # DHT11
# import serial  # HM2201 UART

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def load_env_file(path: str) -> None:
    """Charge KEY=VALUE dans os.environ si la clé n’est pas déjà définie."""
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val


def _env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or not str(raw).strip():
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def read_dht11() -> tuple[float | None, float | None]:
    """Température °C, humidité %. None si non branché."""
    # Exemple Adafruit_DHT (adapter le pin BCM) :
    # import Adafruit_DHT
    # sensor, pin = Adafruit_DHT.DHT11, 4
    # h, t = Adafruit_DHT.read_retry(sensor, pin)
    # if h is not None and t is not None:
    #     return float(t), float(h)
    return None, None


def read_grove_air_quality_index() -> int | None:
    """Indice qualité air (Grove Air Quality v1.3)."""
    return None


def read_grove_co2_ppm() -> float | None:
    """CO₂ ppm."""
    return None


def read_hm2201_pm() -> tuple[float | None, float | None, float | None]:
    """PM1, PM2.5, PM10 en µg/m³."""
    return None, None, None


def mock_payload(t: float) -> Dict[str, Any]:
    base = 420 + math.sin(t / 60.0) * 80
    aqi = int(round(45 + math.sin(t / 45.0) * 25 + (random.random() - 0.5) * 8))
    return {
        "airQualityIndex": max(0, min(300, aqi)),
        "temperatureC": round(21.5 + math.sin(t / 120.0) * 2 + (random.random() - 0.5) * 0.6, 1),
        "humidityPct": int(round(48 + math.sin(t / 90.0) * 8 + (random.random() - 0.5) * 3)),
        "co2ppm": int(round(base + (random.random() - 0.5) * 40)),
        "pm1": int(round(4 + random.random() * 6)),
        "pm25": int(round(8 + random.random() * 12)),
        "pm10": int(round(12 + random.random() * 15)),
    }


def build_payload() -> Dict[str, Any]:
    mock = os.environ.get("MOCK_MODE", "0").strip().lower() in ("1", "true", "yes", "on")
    if mock:
        return mock_payload(time.time())

    temp, rh = read_dht11()
    aqi = read_grove_air_quality_index()
    co2 = read_grove_co2_ppm()
    pm1, pm25, pm10 = read_hm2201_pm()

    if temp is None:
        temp = 21.0
    if rh is None:
        rh = 50.0
    if aqi is None:
        aqi = 50
    if co2 is None:
        co2 = 450.0
    if pm1 is None:
        pm1 = 5.0
    if pm25 is None:
        pm25 = 10.0
    if pm10 is None:
        pm10 = 15.0

    return {
        "airQualityIndex": int(max(0, min(500, aqi))),
        "temperatureC": float(temp),
        "humidityPct": int(max(0, min(100, round(rh)))),
        "co2ppm": int(max(0, co2)),
        "pm1": int(max(0, pm1)),
        "pm25": int(max(0, pm25)),
        "pm10": int(max(0, pm10)),
    }


def post_sensor(api_url: str, api_key: str | None, payload: Dict[str, Any]) -> requests.Response:
    url = f"{api_url.rstrip('/')}/api/sensor"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["X-API-Key"] = api_key
    return requests.post(url, json=payload, headers=headers, timeout=45)


def check_health(api_url: str) -> bool:
    url = f"{api_url.rstrip('/')}/api/health"
    try:
        r = requests.get(url, timeout=15)
        return r.ok
    except requests.RequestException:
        return False


def run_loop(api_url: str, api_key: str | None, interval: float, once: bool) -> int:
    if not check_health(api_url):
        print(
            "[pi_sensor_sender] Avertissement : /api/health ne répond pas (vérifie l’URL ou attends le réveil Render).",
            file=sys.stderr,
        )

    print(
        f"[pi_sensor_sender] Cible={api_url}  interval={interval}s  "
        f"MOCK_MODE={os.environ.get('MOCK_MODE', '0')}  --once={once}"
    )

    while True:
        r: requests.Response | None = None
        try:
            body = build_payload()
            r = post_sensor(api_url, api_key, body)
            if r.ok:
                print(f"OK {r.status_code} — {json.dumps(body, ensure_ascii=False)}")
            else:
                print(f"HTTP {r.status_code}: {r.text[:500]}", file=sys.stderr)
        except requests.RequestException as e:
            print(f"Erreur réseau : {e}", file=sys.stderr)

        if once:
            if r is not None:
                return 0 if r.ok else 1
            return 1

        time.sleep(interval)


def main() -> int:
    load_env_file(os.path.join(_SCRIPT_DIR, ".env"))

    parser = argparse.ArgumentParser(description="Envoie les mesures vers POST /api/sensor")
    parser.add_argument("--once", action="store_true", help="Un seul envoi puis quitte")
    args = parser.parse_args()

    api_url = os.environ.get("API_URL", "").strip()
    if not api_url:
        print(
            "Erreur : définir API_URL dans .env ou l’environnement "
            "(ex. https://qualitedelair.onrender.com)",
            file=sys.stderr,
        )
        return 1

    api_key = os.environ.get("SENSOR_API_KEY", "").strip() or None
    interval = _env_float("INTERVAL_SEC", 5.0)
    if interval < 1.0:
        interval = 1.0

    try:
        return run_loop(api_url, api_key, interval, args.once)
    except KeyboardInterrupt:
        print("\n[pi_sensor_sender] Arrêt.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
