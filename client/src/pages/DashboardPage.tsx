import { RadialGauge } from "../components/RadialGauge";
import { DashboardAlerts } from "../components/DashboardAlerts";
import {
  THRESHOLDS,
  alertLevelForMetric,
  type AlertLevel,
} from "../constants/thresholds";
import { useSourcePreference } from "../context/SourcePreferenceContext";
import { useSensorStream } from "../hooks/useSensorStream";
import "./DashboardPage.css";

function formatTime(ts: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(ts));
}

function valueClass(level: AlertLevel): string {
  return `pm-extra__value pm-extra__value--${level}`;
}

export function DashboardPage() {
  const { snapshot, connected, error } = useSensorStream();
  const { sourceMode, setSourceMode, resolveSnapshot } = useSourcePreference();
  const { snapshot: displaySnap, blocked, message } = resolveSnapshot(snapshot);

  return (
    <div className="dashboard">
      <div className="status-row">
        <span className={`pill ${connected ? "pill-ok" : "pill-warn"}`}>
          {connected ? "Temps réel connecté" : "Déconnecté"}
        </span>

        <label className="source-picker">
          <span className="source-picker__label">Source des données</span>
          <select
            className="source-picker__select"
            value={sourceMode}
            onChange={(e) =>
              setSourceMode(e.target.value as "simulation" | "raspberry")
            }
            aria-label="Choisir la source des mesures"
          >
            <option value="simulation">Simulation (fictif)</option>
            <option value="raspberry">Raspberry Pi ESIEE-IT</option>
          </select>
        </label>

        {snapshot && !blocked && (
          <span className="pill pill-muted">
            Flux :{" "}
            {snapshot.source === "device"
              ? "Raspberry Pi"
              : "Simulation"}
          </span>
        )}
        {error && <span className="pill pill-error">{error}</span>}
      </div>

      {!snapshot && !error && (
        <p className="hint">Connexion au flux en cours…</p>
      )}

      {blocked && message && (
        <div className="source-blocked" role="alert">
          <p className="source-blocked__title">Source indisponible</p>
          <p className="source-blocked__text">{message}</p>
        </div>
      )}

      {displaySnap && !blocked && (
        <>
          <p className="last-update">
            Dernière mesure : {formatTime(displaySnap.ts)}
          </p>

          <DashboardAlerts snapshot={displaySnap} />

          <section className="gauge-section" aria-label="Jauges en direct">
            <h2 className="section-heading">Mesures en direct</h2>
            <div className="gauge-grid">
              <RadialGauge
                title="Indice qualité · Grove Air v1.3"
                value={displaySnap.airQualityIndex}
                unit="pts"
                thresholds={THRESHOLDS.airQualityIndex}
                alertLevel={alertLevelForMetric(
                  "airQualityIndex",
                  displaySnap.airQualityIndex
                )}
                formatCenter={(x) => String(Math.round(x))}
              />
              <RadialGauge
                title="CO₂ · Grove"
                value={displaySnap.co2ppm}
                unit="ppm"
                thresholds={THRESHOLDS.co2ppm}
                alertLevel={alertLevelForMetric("co2ppm", displaySnap.co2ppm)}
                formatCenter={(x) => String(Math.round(x))}
              />
              <RadialGauge
                title="PM2.5 · HM2201"
                value={displaySnap.pm25}
                unit="µg/m³"
                thresholds={THRESHOLDS.pm25}
                alertLevel={alertLevelForMetric("pm25", displaySnap.pm25)}
              />
              <RadialGauge
                title="PM10 · HM2201"
                value={displaySnap.pm10}
                unit="µg/m³"
                thresholds={THRESHOLDS.pm10}
                alertLevel={alertLevelForMetric("pm10", displaySnap.pm10)}
              />
              <RadialGauge
                title="Humidité · DHT11"
                value={displaySnap.humidityPct}
                unit="%"
                thresholds={THRESHOLDS.humidityPct}
                alertLevel={alertLevelForMetric(
                  "humidityPct",
                  displaySnap.humidityPct
                )}
              />
              <RadialGauge
                title="Température · DHT11"
                value={displaySnap.temperatureC}
                unit="°C"
                thresholds={THRESHOLDS.temperatureC}
                alertLevel={alertLevelForMetric(
                  "temperatureC",
                  displaySnap.temperatureC
                )}
                formatCenter={(x) => String(Math.round(x * 10) / 10)}
              />
            </div>
          </section>

          <section className="pm-extra" aria-label="PM1">
            <span className="pm-extra__label">PM1 (HM2201)</span>
            <span
              className={valueClass(
                alertLevelForMetric("pm25", displaySnap.pm1)
              )}
            >
              {displaySnap.pm1} µg/m³
            </span>
            <span className="pm-extra__hint">
              Couleur selon les mêmes ordres de grandeur que le PM2.5 (OMS)
            </span>
          </section>
        </>
      )}
    </div>
  );
}
