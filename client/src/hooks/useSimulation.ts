import { useState, useEffect, useRef, useCallback } from "react";
import type { SensorSnapshot } from "../types";

function mockSnapshot(): SensorSnapshot {
  const t = Date.now();
  const base = 420 + Math.sin(t / 60000) * 80;
  const aqi = Math.round(45 + Math.sin(t / 45000) * 25 + (Math.random() - 0.5) * 8);
  return {
    ts: t,
    airQualityIndex: Math.max(0, Math.min(300, aqi)),
    airQualityLabel: aqi <= 50 ? "Excellent" : aqi <= 100 ? "Bon" : aqi <= 150 ? "Modéré" : "Mauvais",
    temperatureC: Math.round((21.5 + Math.sin(t / 120000) * 2 + (Math.random() - 0.5) * 0.6) * 10) / 10,
    humidityPct: Math.round(48 + Math.sin(t / 90000) * 8 + (Math.random() - 0.5) * 3),
    co2ppm: Math.round(base + (Math.random() - 0.5) * 40),
    pm1: Math.round(4 + Math.random() * 6),
    pm25: Math.round(8 + Math.random() * 12),
    pm10: Math.round(12 + Math.random() * 15),
    source: "mock",
  };
}

export function useSimulation(active: boolean) {
  const [snapshot, setSnapshot] = useState<SensorSnapshot | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setSnapshot(mockSnapshot());
    intervalRef.current = setInterval(() => {
      setSnapshot(mockSnapshot());
    }, 1500);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSnapshot(null);
  }, []);

  useEffect(() => {
    if (active) start();
    else stop();
    return () => stop();
  }, [active, start, stop]);

  return { snapshot };
}
