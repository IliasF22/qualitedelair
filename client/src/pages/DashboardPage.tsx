import { useState } from "react";
import { RadialGauge } from "../components/RadialGauge";
import { DashboardAlerts } from "../components/DashboardAlerts";
import { ModeSelector } from "../components/ModeSelector";
import { DisconnectedScreen } from "../components/DisconnectedScreen";
import {
  THRESHOLDS,
  alertLevelForMetric,
} from "../constants/thresholds";
import { useSensorStream } from "../hooks/useSensorStream";
import { useSimulation } from "../hooks/useSimulation";
import "./DashboardPage.css";

function formatTime(ts: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(ts));
}

/**
 * Détecte si un capteur individuel est en erreur.
 * Convention : si la valeur du capteur est exactement la valeur par défaut
 * ET que d'autres capteurs fonctionnent, on considère qu'il est en panne.
 * Pour le mode simulation ou appareil, on vérifie juste null/undefined.
 */
function isSensorFailing(value: number | null | undefined): boolean {
  return value == null;
}

export function DashboardPage() {
  const [mode, setMode] = useState<"device" | "simulation">("device");
  const { snapshot: deviceSnapshot, connected, error, stale } = useSensorStream();
  const { snapshot: simSnapshot } = useSimulation(mode === "simulation");

  const snapshot = mode === "simulation" ? simSnapshot : deviceSnapshot;
  const isDeviceMode = mode === "device";

  // En mode device, si déconnecté ET pas de données OU données périmées
  const showDisconnected = isDeviceMode && (!connected || stale) && !snapshot;

  return (
    <div className="dashboard">
      {/* ── Sélecteur de mode ── */}
      <ModeSelector mode={mode} onSelect={setMode} connected={connected && !stale} />

      {/* ── Ligne de statut ── */}
      <div className="status-row">
        {mode === "device" && (
          <span className={`pill ${connected && !stale ? "pill-ok" : "pill-warn"}`}>
            {connected && !stale ? "Temps réel connecté" : stale ? "Données périmées" : "Déconnecté"}
          </span>
        )}
        {mode === "simulation" && (
          <span className="pill pill-sim">Mode simulation</span>
        )}
        {snapshot && (
          <span className="pill pill-muted">
            Source : {mode === "simulation" ? "Simulation" : snapshot.source === "device" ? "Raspberry Pi" : "Serveur"}
          </span>
        )}
        {error && <span className="pill pill-error">{error}</span>}
      </div>

      {/* ── Écran déconnecté ── */}
      {showDisconnected && <DisconnectedScreen />}

      {/* ── Chargement ── */}
      {!snapshot && !showDisconnected && !error && (
        <p className="hint">
          <span className="hint-spinner" />
          Connexion au flux en cours…
        </p>
      )}

      {/* ── Dashboard principal ── */}
      {snapshot && (
        <>
          <p className="last-update">Dernière mesure : {formatTime(snapshot.ts)}</p>

          {/* Alerte si données périmées en mode device */}
          {isDeviceMode && stale && (
            <div className="dashboard-alerts" role="alert">
              <span className="dashboard-alerts__title">⚠ Données obsolètes</span>
              <span className="dashboard-alerts__msg" style={{ color: "var(--amber)" }}>
                Aucune nouvelle donnée reçue depuis plus de 15 secondes. Vérifiez la connexion du Raspberry Pi.
              </span>
            </div>
          )}

          <DashboardAlerts snapshot={snapshot} />

          <section className="gauge-section" aria-label="Jauges en direct">
            <h2 className="section-heading">Mesures en direct</h2>
            <div className="gauge-grid">
              <RadialGauge
                title="Indice qualité · Grove Air v1.3"
                value={isSensorFailing(snapshot.airQualityIndex) ? null : snapshot.airQualityIndex}
                unit="pts"
                thresholds={THRESHOLDS.airQualityIndex}
                alertLevel={alertLevelForMetric("airQualityIndex", snapshot.airQualityIndex ?? 0)}
                formatCenter={(x) => String(Math.round(x))}
              />
              <RadialGauge
                title="CO₂ · Grove"
                value={isSensorFailing(snapshot.co2ppm) ? null : snapshot.co2ppm}
                unit="ppm"
                thresholds={THRESHOLDS.co2ppm}
                alertLevel={alertLevelForMetric("co2ppm", snapshot.co2ppm ?? 0)}
                formatCenter={(x) => String(Math.round(x))}
              />
              <RadialGauge
                title="PM2.5 · HM3301"
                value={isSensorFailing(snapshot.pm25) ? null : snapshot.pm25}
                unit="µg/m³"
                thresholds={THRESHOLDS.pm25}
                alertLevel={alertLevelForMetric("pm25", snapshot.pm25 ?? 0)}
              />
              <RadialGauge
                title="PM10 · HM3301"
                value={isSensorFailing(snapshot.pm10) ? null : snapshot.pm10}
                unit="µg/m³"
                thresholds={THRESHOLDS.pm10}
                alertLevel={alertLevelForMetric("pm10", snapshot.pm10 ?? 0)}
              />
              <RadialGauge
                title="Humidité · DHT11"
                value={isSensorFailing(snapshot.humidityPct) ? null : snapshot.humidityPct}
                unit="%"
                thresholds={THRESHOLDS.humidityPct}
                alertLevel={alertLevelForMetric("humidityPct", snapshot.humidityPct ?? 0)}
              />
              <RadialGauge
                title="Température · DHT11"
                value={isSensorFailing(snapshot.temperatureC) ? null : snapshot.temperatureC}
                unit="°C"
                thresholds={THRESHOLDS.temperatureC}
                alertLevel={alertLevelForMetric("temperatureC", snapshot.temperatureC ?? 0)}
                formatCenter={(x) => String(Math.round(x * 10) / 10)}
              />
            </div>
          </section>

          <section className="pm-extra" aria-label="PM1">
            <span className="pm-extra__label">PM1 (HM3301)</span>
            <span className="pm-extra__value">
              {isSensorFailing(snapshot.pm1) ? "—" : `${snapshot.pm1} µg/m³`}
            </span>
            <span className="pm-extra__hint">Seuil indicatif PM2.5 : voir jauge ci-dessus</span>
          </section>
        </>
      )}
    </div>
  );
}
