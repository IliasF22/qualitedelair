import type { AlertLevel } from "../constants/thresholds";
import { THRESHOLDS, alertLabel, alertLevelForMetric } from "../constants/thresholds";
import type { SensorSnapshot } from "../types";
import "./DashboardAlerts.css";

type Item = { id: string; label: string; level: AlertLevel };
type MetricId = keyof typeof THRESHOLDS;

function collectItems(s: SensorSnapshot): Item[] {
  const checks: { id: MetricId; label: string; value: number }[] = [
    { id: "airQualityIndex", label: "Indice qualité (Grove)", value: s.airQualityIndex },
    { id: "co2ppm", label: "CO₂", value: s.co2ppm },
    { id: "pm25", label: "PM2.5", value: s.pm25 },
    { id: "pm10", label: "PM10", value: s.pm10 },
    { id: "humidityPct", label: "Humidité", value: s.humidityPct },
    { id: "temperatureC", label: "Température", value: s.temperatureC },
  ];

  return checks.map((c) => ({
    id: c.id,
    label: c.label,
    level: alertLevelForMetric(c.id, c.value),
  }));
}

export function DashboardAlerts({ snapshot }: { snapshot: SensorSnapshot }) {
  const items = collectItems(snapshot);
  const danger = items.filter((i) => i.level === "danger");
  const warn = items.filter((i) => i.level === "warn");

  if (danger.length === 0 && warn.length === 0) {
    return (
      <div className="dashboard-alerts dashboard-alerts--ok" role="status">
        <span className="dashboard-alerts__title">Seuils</span>
        <span className="dashboard-alerts__msg">Toutes les mesures restent dans les plages recommandées.</span>
      </div>
    );
  }

  return (
    <div className="dashboard-alerts" role="alert">
      <span className="dashboard-alerts__title">Alertes temps réel</span>
      <ul className="dashboard-alerts__list">
        {danger.map((i) => (
          <li key={i.id} className="dashboard-alerts__item dashboard-alerts__item--danger">
            <strong>{i.label}</strong> — {alertLabel("danger")}
          </li>
        ))}
        {warn.map((i) => (
          <li key={i.id} className="dashboard-alerts__item dashboard-alerts__item--warn">
            <strong>{i.label}</strong> — {alertLabel("warn")}
          </li>
        ))}
      </ul>
    </div>
  );
}
