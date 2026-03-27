import { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiUrl } from "../lib/apiBase";
import type { SensorSnapshot } from "../types";
import "./HistoryPage.css";

const CHART_COLORS = {
  co2: "#37c4ef",
  pm25: "#5c43a0",
  temp: "#4a7dc0",
  rh: "#8b7ec8",
};

function formatAxisTime(ts: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function HistoryPage() {
  const [hours, setHours] = useState(24);
  const [points, setPoints] = useState<SensorSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(apiUrl(`/api/history?hours=${hours}`));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { points: SensorSnapshot[] };
      setPoints(data.points || []);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Erreur de chargement");
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = points.map((p) => ({
    t: p.ts,
    label: formatAxisTime(p.ts),
    co2: p.co2ppm,
    pm25: p.pm25,
    temp: p.temperatureC,
    rh: p.humidityPct,
  }));

  return (
    <div className="history-page">
      <div className="history-toolbar">
        <label className="hours-label">
          Fenêtre :
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="hours-select"
          >
            <option value={6}>6 h</option>
            <option value={12}>12 h</option>
            <option value={24}>24 h</option>
            <option value={48}>48 h</option>
          </select>
        </label>
        <button type="button" className="refresh-btn" onClick={() => void load()} disabled={loading}>
          {loading ? "Chargement…" : "Actualiser"}
        </button>
      </div>

      {fetchError && <p className="history-error">{fetchError}</p>}

      {!loading && points.length === 0 && !fetchError && (
        <p className="history-empty">Aucune donnée pour cette période. Lance le serveur et attends quelques secondes.</p>
      )}

      {chartData.length > 0 && (
        <div className="chart-panel">
          <h2 className="chart-title">CO₂ et PM2.5</h2>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#9aa0b4", fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#9aa0b4", fontSize: 11 }}
                  label={{ value: "ppm", angle: -90, position: "insideLeft", fill: "#9aa0b4", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#9aa0b4", fontSize: 11 }}
                  label={{ value: "µg/m³", angle: 90, position: "insideRight", fill: "#9aa0b4", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a24",
                    border: "1px solid rgba(55, 196, 239, 0.25)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#edecef" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="co2"
                  name="CO₂ (ppm)"
                  stroke={CHART_COLORS.co2}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pm25"
                  name="PM2.5"
                  stroke={CHART_COLORS.pm25}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="chart-panel">
          <h2 className="chart-title">Température et humidité (DHT11)</h2>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: "#9aa0b4", fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#9aa0b4", fontSize: 11 }}
                  label={{ value: "°C", angle: -90, position: "insideLeft", fill: "#9aa0b4", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#9aa0b4", fontSize: 11 }}
                  domain={[0, 100]}
                  label={{ value: "%", angle: 90, position: "insideRight", fill: "#9aa0b4", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a24",
                    border: "1px solid rgba(55, 196, 239, 0.25)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temp"
                  name="Température (°C)"
                  stroke={CHART_COLORS.temp}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rh"
                  name="Humidité (%)"
                  stroke={CHART_COLORS.rh}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
