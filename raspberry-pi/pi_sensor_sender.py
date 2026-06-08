#!/usr/bin/env python3
"""
Envoie les mesures capteurs vers l'API distante (POST /api/sensor).

Matériel visé : Raspberry Pi + Grove Air Quality v1.3, DHT11, Grove CO2, HM2201 (PM).
Les lectures réelles dépendent du câblage et des libs (Seeed / Adafruit / UART).
Sans capteurs : définir MOCK_MODE=1 pour tester la chaîne jusqu'au serveur.

Variables d'environnement :
  API_URL          URL du serveur (ex. https://xxx.onrender.com) — sans slash final
  SENSOR_API_KEY   Même clé que sur le serveur (header X-API-Key), si configurée
  INTERVAL_SEC     Intervalle entre envois (défaut 5)
  MOCK_MODE        1 = données factices (défaut 0)
"""

from __future__ import annotations

import json
import math
import os
import random
import sys
import time
from typing import Any, Dict

import requests

# ---------------------------------------------------------------------------
# À brancher : imports optionnels selon ton installation (décommenter au besoin)
# ---------------------------------------------------------------------------
# import Adafruit_DHT  # pip install Adafruit-DHT (DHT11)
# import board, busio  # circuitpython / grove
# import serial  # pip install pyserial — HM2201 souvent UART

try:
    import board
    import adafruit_dht
    dht_device = adafruit_dht.DHT11(board.D4)
except Exception as e:
    print(f"Attention: Impossible d'initialiser DHT11: {e}")
    dht_device = None

try:
    import serial
    ser_co2 = serial.Serial('/dev/serial0', 9600, timeout=0.2)
except Exception as e:
    print(f"Attention: Impossible d'initialiser CO2 (serial0): {e}")
    ser_co2 = None

try:
    from grove.grove_air_quality_sensor_v1_3 import GroveAirQualitySensor
    grove_aq_sensor = GroveAirQualitySensor(0)
except Exception as e:
    print(f"Attention: Impossible d'initialiser Grove Air Quality (A0): {e}")
    grove_aq_sensor = None

try:
    import smbus2
    bus = smbus2.SMBus(1)
except Exception as e:
    print(f"Attention: Impossible d'initialiser I2C (smbus2): {e}")
    bus = None


def _env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or not str(raw).strip():
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _env_int(name: str, default: int) -> int:
    return int(_env_float(name, float(default)))


def read_dht11() -> tuple[float | None, float | None]:
    """Retourne (température °C, humidité %). None si non branché."""
    if dht_device is None:
        return None, None
    try:
        t = dht_device.temperature
        h = dht_device.humidity
        if t is not None and h is not None:
            return float(t), float(h)
    except RuntimeError:
        # DHT11 rate souvent des lectures (timing)
        pass
    except Exception as e:
        print(f"Erreur lecture DHT11: {e}")
    return None, None


def read_grove_air_quality_index() -> int | None:
    """Indice 0–500+ selon ton driver Grove Air Quality v1.3 (ADC / bus)."""
    if grove_aq_sensor is None:
        return None
    try:
        val = grove_aq_sensor.value
        if val is not None:
            return int(val)
    except Exception as e:
        print(f"Erreur lecture Grove AQ: {e}")
    return None


def read_grove_co2_ppm() -> float | None:
    """CO2 en ppm (Grove — souvent UART ou modulation)."""
    if ser_co2 is None:
        return None
    try:
        cmd = b'\xff\x01\x86\x00\x00\x00\x00\x00\x79'
        ser_co2.reset_input_buffer()
        ser_co2.write(cmd)
        result = ser_co2.read(9)
        if len(result) == 9 and result[0] == 0xff and result[1] == 0x86:
            ppm = result[2] * 256 + result[3]
            return float(ppm)
    except Exception as e:
        print(f"Erreur lecture CO2: {e}")
    return None


def read_hm2201_pm() -> tuple[float | None, float | None, float | None]:
    """PM1, PM2.5, PM10 en µg/m³ (HM3301 via I2C)."""
    if bus is None:
        return None, None, None
    try:
        data = bus.read_i2c_block_data(0x40, 0x88, 29)
        checksum = sum(data[:28]) & 0xFF
        if checksum != data[28]:
            return None, None, None
            
        pm1_0 = (data[4] << 8) | data[5]
        pm2_5 = (data[6] << 8) | data[7]
        pm10  = (data[8] << 8) | data[9]
        
        return pm1_0, pm2_5, pm10
    except Exception as e:
        return None, None, None


def mock_payload(t: float) -> Dict[str, Any]:
    """Données de test (même esprit que le mock Node)."""
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
    mock = os.environ.get("MOCK_MODE", "0").strip() in ("1", "true", "yes")
    if mock:
        return mock_payload(time.time())

    temp, rh = read_dht11()
    aqi = read_grove_air_quality_index()
    co2 = read_grove_co2_ppm()
    pm1, pm25, pm10 = read_hm2201_pm()

    # Valeurs de repli si capteurs pas encore câblés (évite POST vide)
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
    return requests.post(url, data=json.dumps(payload), headers=headers, timeout=30)


def main() -> int:
    api_url = os.environ.get("API_URL", "").strip()
    if not api_url:
        print("Erreur : définir API_URL (ex. https://ton-api.onrender.com)", file=sys.stderr)
        return 1

    api_key = os.environ.get("SENSOR_API_KEY", "").strip() or None
    interval = _env_float("INTERVAL_SEC", 5.0)
    if interval < 1.0:
        interval = 1.0

    print(f"[pi_sensor_sender] API_URL={api_url} interval={interval}s MOCK_MODE={os.environ.get('MOCK_MODE', '0')}")

    while True:
        try:
            body = build_payload()
            r = post_sensor(api_url, api_key, body)
            if r.ok:
                print(f"OK {r.status_code} — {body}")
            else:
                print(f"Erreur HTTP {r.status_code}: {r.text[:500]}", file=sys.stderr)
        except requests.RequestException as e:
            print(f"Erreur réseau : {e}", file=sys.stderr)

        time.sleep(interval)


if __name__ == "__main__":
    raise SystemExit(main())
