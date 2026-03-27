import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
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
  aqi: "#a78bfa",
  co2: "#37c4ef",
  pm1: "#34d399",
  pm25: "#5c43a0",
  pm10: "#f472b6",
  temp: "#4a7dc0",
  rh: "#8b7ec8",
};

function formatAxisTime(ts: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

type Visibility = {
  aqi: boolean;
  co2: boolean;
  pm1: boolean;
  pm25: boolean;
  pm10: boolean;
  temp: boolean;
  rh: boolean;
};

const DEFAULT_VIS: Visibility = {
  aqi: true,
  co2: true,
  pm1: true,
  pm25: true,
  pm10: true,
  temp: true,
  rh: true,
};

function ToggleRow({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="series-toggles">{children}</div>;
}

function SeriesToggle({
  color,
  label,
  checked,
  onChange,
  id,
}: {
  color: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <label className="series-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="series-toggle__swatch" style={{ background: color }} />
      {label}
    </label>
  );
}

export function HistoryPage() {
  const baseId = useId();
  const [hours, setHours] = useState(24);
  const [points, setPoints] = useState<SensorSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [vis, setVis] = useState<Visibility>(DEFAULT_VIS);

  const setField = useCallback((key: keyof Visibility, v: boolean) => {
    setVis((prev) => ({ ...prev, [key]: v }));
  }, []);

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
    aqi: p.airQualityIndex,
    co2: p.co2ppm,
    pm1: p.pm1,
    pm25: p.pm25,
    pm10: p.pm10,
    temp: p.temperatureC,
    rh: p.humidityPct,
  }));

  const tooltipStyle = {
    background: "#1a1a24",
    border: "1px solid rgba(55, 196, 239, 0.25)",
    borderRadius: 10,
    fontSize: 12,
  };

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
        <p className="history-empty">Aucune donnée pour cette période.</p>
      )}

      {chartData.length > 0 && (
        <>
          <div className="chart-panel">
            <h2 className="chart-title">Indice qualité & CO₂</h2>
            <ToggleRow>
              <SeriesToggle
                id={`${baseId}-aqi`}
                color={CHART_COLORS.aqi}
                label="Indice (pts)"
                checked={vis.aqi}
                onChange={(v) => setField("aqi", v)}
              />
              <SeriesToggle
                id={`${baseId}-co2`}
                color={CHART_COLORS.co2}
                label="CO₂ (ppm)"
                checked={vis.co2}
                onChange={(v) => setField("co2", v)}
              />
            </ToggleRow>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#9aa0b4", fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    yAxisId="aqi"
                    hide={!vis.aqi}
                    tick={{ fill: "#9aa0b4", fontSize: 11 }}
                    label={{ value: "Indice", angle: -90, position: "insideLeft", fill: "#9aa0b4", fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="co2"
                    orientation="right"
                    hide={!vis.co2}
                    tick={{ fill: "#9aa0b4", fontSize: 11 }}
                    label={{ value: "ppm", angle: 90, position: "insideRight", fill: "#9aa0b4", fontSize: 11 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#edecef" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    yAxisId="aqi"
                    type="monotone"
                    dataKey="aqi"
                    name="Indice"
                    stroke={CHART_COLORS.aqi}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                    hide={!vis.aqi}
                  />
                  <Line
                    yAxisId="co2"
                    type="monotone"
                    dataKey="co2"
                    name="CO₂"
                    stroke={CHART_COLORS.co2}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                    hide={!vis.co2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-panel">
            <h2 className="chart-title">Particules PM1, PM2.5, PM10</h2>
            <ToggleRow>
              <SeriesToggle
                id={`${baseId}-pm1`}
                color={CHART_COLORS.pm1}
                label="PM1"
                checked={vis.pm1}
                onChange={(v) => setField("pm1", v)}
              />
              <SeriesToggle
                id={`${baseId}-pm25`}
                color={CHART_COLORS.pm25}
                label="PM2.5"
                checked={vis.pm25}
                onChange={(v) => setField("pm25", v)}
              />
              <SeriesToggle
                id={`${baseId}-pm10`}
                color={CHART_COLORS.pm10}
                label="PM10"
                checked={vis.pm10}
                onChange={(v) => setField("pm10", v)}
              />
            </ToggleRow>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: "#9aa0b4", fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis
                    tick={{ fill: "#9aa0b4", fontSize: 11 }}
                    label={{ value: "µg/m³", angle: -90, position: "insideLeft", fill: "#9aa0b4", fontSize: 11 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#edecef" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="pm1"
                    name="PM1"
                    stroke={CHART_COLORS.pm1}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                    hide={!vis.pm1}
                  />
                  <Line
                    type="monotone"
                    dataKey="pm25"
                    name="PM2.5"
                    stroke={CHART_COLORS.pm25}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                    hide={!vis.pm25}
                  />
                  <Line
                    type="monotone"
                    dataKey="pm10"
                    name="PM10"
                    stroke={CHART_COLORS.pm10}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                    hide={!vis.pm10}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-panel">
            <h2 className="chart-title">Température & humidité</h2>
            <ToggleRow>
              <SeriesToggle
                id={`${baseId}-temp`}
                color={CHART_COLORS.temp}
                label="Température (°C)"
                checked={vis.temp}
                onChange={(v) => setField("temp", v)}
              />
              <SeriesToggle
                id={`${baseId}-rh`}
                color={CHART_COLORS.rh}
                label="Humidité (%)"
                checked={vis.rh}
                onChange={(v) => setField("rh", v)}
              />
            </ToggleRow>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fill: "#9aa0b4", fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis
                    yAxisId="temp"
                    hide={!vis.temp}
                    tick={{ fill: "#9aa0b4", fontSize: 11 }}
                    label={{ value: "°C", angle: -90, position: "insideLeft", fill: "#9aa0b4", fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="rh"
                    orientation="right"
                    hide={!vis.rh}
                    domain={[0, 100]}
                    tick={{ fill: "#9aa0b4", fontSize: 11 }}
                    label={{ value: "%", angle: 90, position: "insideRight", fill: "#9aa0b4", fontSize: 11 }}
                  />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#edecef" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="temp"
                    name="Température"
                    stroke={CHART_COLORS.temp}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                    hide={!vis.temp}
                  />
                  <Line
                    yAxisId="rh"
                    type="monotone"
                    dataKey="rh"
                    name="Humidité"
                    stroke={CHART_COLORS.rh}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={false}
                    hide={!vis.rh}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
