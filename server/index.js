import express from "express";
import cors from "cors";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 4000;
const HISTORY_MAX = 2880;

function parseOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || !String(raw).trim()) return true;
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const corsOrigin = parseOrigins();

/** @typedef {{
 *   ts: number,
 *   airQualityIndex: number,
 *   airQualityLabel: string,
 *   temperatureC: number,
 *   humidityPct: number,
 *   co2ppm: number,
 *   pm1: number,
 *   pm25: number,
 *   pm10: number,
 *   source: 'mock' | 'device'
 * }} SensorSnapshot */

/** @type {SensorSnapshot[]} */
const history = [];

function labelFromAqi(index) {
  if (index <= 50) return "Excellent";
  if (index <= 100) return "Bon";
  if (index <= 150) return "Modéré";
  if (index <= 200) return "Médiocre";
  return "Mauvais";
}

function mockSnapshot() {
  const t = Date.now();
  const base = 420 + Math.sin(t / 60000) * 80;
  const airQualityIndex = Math.round(
    45 + Math.sin(t / 45000) * 25 + (Math.random() - 0.5) * 8
  );
  return {
    ts: t,
    airQualityIndex,
    airQualityLabel: labelFromAqi(airQualityIndex),
    temperatureC: Math.round((21.5 + Math.sin(t / 120000) * 2 + (Math.random() - 0.5) * 0.6) * 10) / 10,
    humidityPct: Math.round(48 + Math.sin(t / 90000) * 8 + (Math.random() - 0.5) * 3),
    co2ppm: Math.round(base + (Math.random() - 0.5) * 40),
    pm1: Math.round(4 + Math.random() * 6),
    pm25: Math.round(8 + Math.random() * 12),
    pm10: Math.round(12 + Math.random() * 15),
    source: "mock",
  };
}

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "64kb" }));

function sensorAuth(req, res, next) {
  const expected = process.env.SENSOR_API_KEY;
  if (!expected) return next();
  const header = req.headers["x-api-key"];
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (header === expected || bearer === expected) return next();
  return res.status(401).json({ ok: false, error: "unauthorized" });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.get("/api/history", (req, res) => {
  const hours = Math.min(168, Math.max(1, Number(req.query.hours) || 24));
  const since = Date.now() - hours * 3600 * 1000;
  const slice = history.filter((h) => h.ts >= since);
  res.json({ points: slice });
});

function num(body, key, fallback = 0) {
  const v = Number(body[key]);
  return Number.isFinite(v) ? v : fallback;
}

app.post("/api/sensor", sensorAuth, (req, res) => {
  const body = req.body || {};
  const aqi = num(body, "airQualityIndex", 0);
  const snapshot = {
    ts: Date.now(),
    airQualityIndex: aqi,
    airQualityLabel: String(body.airQualityLabel || labelFromAqi(aqi)),
    temperatureC: num(body, "temperatureC"),
    humidityPct: num(body, "humidityPct"),
    co2ppm: num(body, "co2ppm"),
    pm1: num(body, "pm1"),
    pm25: num(body, "pm25"),
    pm10: num(body, "pm10"),
    source: "device",
  };
  pushHistory(snapshot);
  io.emit("sensor:update", snapshot);
  res.json({ ok: true });
});

/** Site React (build Vite) — même processus que l’API (Render, etc.). */
const staticDir = path.join(__dirname, "..", "client", "dist");
const staticIndexHtml = path.join(staticDir, "index.html");

function shouldServeStatic() {
  if (process.env.SERVE_STATIC === "0" || process.env.SERVE_STATIC === "false") {
    return false;
  }
  if (process.env.SERVE_STATIC === "1" || process.env.SERVE_STATIC === "true") {
    return true;
  }
  /* Prod sans variable explicite (ex. Render : oubli de SERVE_STATIC=1) */
  if (process.env.NODE_ENV === "production" && fs.existsSync(staticIndexHtml)) {
    return true;
  }
  return false;
}

if (shouldServeStatic()) {
  app.use(express.static(staticDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(staticIndexHtml);
  });
}

function pushHistory(s) {
  history.push(s);
  while (history.length > HISTORY_MAX) history.shift();
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
  },
});

let mockInterval = null;

function startMockStream() {
  if (process.env.DISABLE_MOCK === "1" || process.env.DISABLE_MOCK === "true") return;
  if (mockInterval) return;
  mockInterval = setInterval(() => {
    const snap = mockSnapshot();
    pushHistory(snap);
    io.emit("sensor:update", snap);
  }, 2000);
}

io.on("connection", (socket) => {
  const last = history[history.length - 1];
  if (last) socket.emit("sensor:update", last);
});

startMockStream();

httpServer.listen(PORT, () => {
  console.log(`[air-quality] API + WebSocket port ${PORT}`);
  if (shouldServeStatic()) {
    console.log(`[air-quality] Fichiers statiques: ${staticDir}`);
  }
  if (process.env.SENSOR_API_KEY) console.log("[air-quality] SENSOR_API_KEY activé (POST /api/sensor protégé)");
  if (process.env.DISABLE_MOCK === "1" || process.env.DISABLE_MOCK === "true") {
    console.log("[air-quality] Mock désactivé — envoyer des données depuis le Raspberry Pi");
  }
});
