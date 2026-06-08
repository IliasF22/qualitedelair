# Raspberry Pi — envoi des mesures

## Installation

Sur le Raspberry Pi (Python 3.10+) :

```bash
cd raspberry-pi
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configuration

Copier `.env.example` vers `.env` ou exporter les variables :

| Variable | Description |
|----------|-------------|
| `API_URL` | URL HTTPS du serveur Node (ex. `https://ton-service.onrender.com`) |
| `SENSOR_API_KEY` | Identique à `SENSOR_API_KEY` sur le serveur (si tu l’as activée) |
| `INTERVAL_SEC` | Secondes entre deux envois (défaut `5`) |
| `MOCK_MODE` | `1` = données factices pour tester sans capteurs |

```bash
export API_URL="https://ton-api.onrender.com"
export SENSOR_API_KEY="ta-cle-secrete"
export INTERVAL_SEC=5
export MOCK_MODE=0
python3 pi_sensor_sender.py
```

## Brancher les capteurs

1. **DHT11** : GPIO + lib Adafruit ou équivalent — compléter `read_dht11()` dans `pi_sensor_sender.py`.
2. **Grove Air Quality v1.3** : selon shield / ADC Seeed — compléter `read_grove_air_quality_index()`.
3. **Grove CO₂** : souvent UART — compléter `read_grove_co2_ppm()`.
4. **HM2201** : trame série PM1 / PM2.5 / PM10 — compléter `read_hm2201_pm()`.

Tant que ces fonctions renvoient `None`, le script utilise des **valeurs de repli** numériques (pour ne pas envoyer de POST vide). En `MOCK_MODE=1`, tout est simulé.

## Service systemd (optionnel)

```ini
[Unit]
Description=ESIEE air quality sensor sender
After=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/air-quality-web/raspberry-pi
EnvironmentFile=/home/pi/air-quality-web/raspberry-pi/.env
ExecStart=/home/pi/air-quality-web/raspberry-pi/.venv/bin/python3 pi_sensor_sender.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Puis `sudo systemctl enable --now esiee-sensor.service`.
