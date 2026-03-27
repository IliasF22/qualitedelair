# Raspberry Pi — envoi des mesures vers le site

Les données partent en **`POST /api/sensor`** sur l’URL configurée (ex. **`https://qualitedelair.onrender.com`**).

## Installation

Sur le Raspberry Pi (Python 3.10+) :

```bash
cd raspberry-pi
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
nano .env   # renseigner au minimum API_URL (et SENSOR_API_KEY si tu l’utilises sur Render)
```

## Configuration (fichier `.env`)

Le script charge automatiquement **`raspberry-pi/.env`** s’il existe.

| Variable | Description |
|----------|-------------|
| `API_URL` | URL HTTPS **sans** `/` final (ex. `https://qualitedelair.onrender.com`) |
| `SENSOR_API_KEY` | Même valeur que sur Render si tu as défini `SENSOR_API_KEY` |
| `INTERVAL_SEC` | Secondes entre deux envois (défaut `5`) |
| `MOCK_MODE` | `1` = données simulées (recommandé pour tester sans capteurs) |

## Lancer

```bash
source .venv/bin/activate
python3 pi_sensor_sender.py              # envoi en boucle
python3 pi_sensor_sender.py --once       # un seul test puis arrêt
```

Ou : `chmod +x run.sh && ./run.sh`

Sans fichier `.env`, tu peux exporter les variables :

```bash
export API_URL="https://qualitedelair.onrender.com"
export SENSOR_API_KEY="ta-cle-secrete"
export INTERVAL_SEC=5
export MOCK_MODE=1
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
