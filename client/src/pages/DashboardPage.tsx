import { RadialGauge } from "../components/RadialGauge";
import { DashboardAlerts } from "../components/DashboardAlerts";
import {
  THRESHOLDS,
  alertLevelForMetric,
} from "../constants/thresholds";
import { useSensorStream } from "../hooks/useSensorStream";
import "./DashboardPage.css";

function formatTime(ts: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(ts));
}

export function DashboardPage() {
  const { snapshot, connected, error } = useSensorStream();

  return (
    <div className="dashboard">
      <div className="status-row">
        <span className={`pill ${connected ? "pill-ok" : "pill-warn"}`}>
          {connected ? "Temps réel connecté" : "Déconnecté"}
        </span>
        {snapshot && (
          <span className="pill pill-muted">
            Source : {snapshot.source === "device" ? "Raspberry Pi" : "Simulation"}
          </span>
        )}
        {error && <span className="pill pill-error">{error}</span>}
      </div>

      {!snapshot && !error && (
        <p className="hint">Connexion au flux en cours…</p>
      )}

      {snapshot && (
        <>
          <p className="last-update">Dernière mesure : {formatTime(snapshot.ts)}</p>

          <DashboardAlerts snapshot={snapshot} />

          <section className="gauge-section" aria-label="Jauges en direct">
            <h2 className="section-heading">Mesures en direct</h2>
            <div className="gauge-grid">
              <RadialGauge
                title="Indice qualité · Grove Air v1.3"
                value={snapshot.airQualityIndex}
                unit="pts"
                thresholds={THRESHOLDS.airQualityIndex}
                alertLevel={alertLevelForMetric("airQualityIndex", snapshot.airQualityIndex)}
                formatCenter={(x) => String(Math.round(x))}
              />
              <RadialGauge
                title="CO₂ · Grove"
                value={snapshot.co2ppm}
                unit="ppm"
                thresholds={THRESHOLDS.co2ppm}
                alertLevel={alertLevelForMetric("co2ppm", snapshot.co2ppm)}
                formatCenter={(x) => String(Math.round(x))}
              />
              <RadialGauge
                title="PM2.5 · HM2201"
                value={snapshot.pm25}
                unit="µg/m³"
                thresholds={THRESHOLDS.pm25}
                alertLevel={alertLevelForMetric("pm25", snapshot.pm25)}
              />
              <RadialGauge
                title="PM10 · HM2201"
                value={snapshot.pm10}
                unit="µg/m³"
                thresholds={THRESHOLDS.pm10}
                alertLevel={alertLevelForMetric("pm10", snapshot.pm10)}
              />
              <RadialGauge
                title="Humidité · DHT11"
                value={snapshot.humidityPct}
                unit="%"
                thresholds={THRESHOLDS.humidityPct}
                alertLevel={alertLevelForMetric("humidityPct", snapshot.humidityPct)}
              />
              <RadialGauge
                title="Température · DHT11"
                value={snapshot.temperatureC}
                unit="°C"
                thresholds={THRESHOLDS.temperatureC}
                alertLevel={alertLevelForMetric("temperatureC", snapshot.temperatureC)}
                formatCenter={(x) => String(Math.round(x * 10) / 10)}
              />
            </div>
          </section>

          <section className="pm-extra" aria-label="PM1">
            <span className="pm-extra__label">PM1 (HM2201)</span>
            <span className="pm-extra__value">{snapshot.pm1} µg/m³</span>
            <span className="pm-extra__hint">Seuil indicatif PM2.5 : voir jauge ci-dessus</span>
          </section>
        </>
      )}
    </div>
  );
}
