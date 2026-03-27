# Station qualité de l’air — ESIEE

Détection de qualité de l’air — projet ESIEE-IT.

Interface web (React + Vite) et API Node (Express + Socket.io) pour afficher les mesures des capteurs :

- **Grove Air Quality Sensor v1.3** — indice / qualité perçue  
- **DHT11** — température et humidité  
- **Grove CO₂** — concentration en ppm  
- **HM2201** — particules PM1 / PM2.5 / PM10  

## Développement local

Prérequis : Node.js 20+.

```bash
cd air-quality-web
npm install
npm run install:all
npm run dev
```

- **Interface** : [http://localhost:5173](http://localhost:5173)  
- **API / WebSocket** : [http://localhost:4000](http://localhost:4000)  

Le proxy Vite redirige `/api` et `/socket.io` vers le port 4000.

En local, le serveur émet des **données simulées** toutes les 2 secondes (sauf si `DISABLE_MOCK=1` dans `server/.env`).

## Raspberry Pi

Script Python : **`raspberry-pi/pi_sensor_sender.py`** — envoie `POST /api/sensor` vers ton serveur. Voir **`raspberry-pi/README.md`**.

Variables utiles : `API_URL`, `SENSOR_API_KEY`, `INTERVAL_SEC`, `MOCK_MODE=1` pour tester sans matériel.

## Hébergement gratuit

**Le plus simple** : **tout sur Render** (API + site sur la même URL) — voir **`DEPLOY_SIMPLE.md`** et le fichier **`render.yaml`** à la racine du repo. Pas besoin de Netlify ni de GitHub Actions.

**Option avancée** : site sur **Netlify** + API sur **Render** — voir **`DEPLOY.md`**.

- **CI GitHub** (optionnel) : workflow « Air quality — CI » ; déploiement Netlify manuel via « Air quality — Deploy Netlify ». **Interface GitHub** : **`GITHUB.md`**.

Variables importantes :

- **Netlify (build)** : `VITE_BACKEND_URL` = URL HTTPS de ton API (ex. `https://xxx.onrender.com`).
- **Serveur** : `ALLOWED_ORIGINS` = ton domaine Netlify ; `SENSOR_API_KEY` = optionnel mais recommandé ; `DISABLE_MOCK=1` en prod avec le Pi.

## API

`POST /api/sensor` — corps JSON :

```json
{
  "airQualityIndex": 72,
  "temperatureC": 22.4,
  "humidityPct": 51,
  "co2ppm": 450,
  "pm1": 5,
  "pm25": 12,
  "pm10": 18
}
```

Si `SENSOR_API_KEY` est défini sur le serveur, envoyer le header `X-API-Key: <même clé>`.

Chaque envoi met à jour le dashboard en temps réel (Socket.io `sensor:update`) et l’historique.
