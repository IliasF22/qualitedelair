/** Niveau d’alerte dérivé des seuils (affichage + couleur de jauge). */
export type AlertLevel = "ok" | "warn" | "danger";

export type MetricThresholds = {
  /** Valeur max affichée sur la jauge */
  min: number;
  max: number;
  /** Graduations affichées sur l’arc (comme l’exemple 0…300) */
  ticks: number[];
  /** Seuil « attention » (jaune) — au-delà : zone à surveiller */
  warn: number;
  /** Seuil « alerte » (rouge) */
  danger: number;
  /** Libellés pour le panneau sous la jauge */
  legend: string[];
};

export const THRESHOLDS = {
  /** Indice type AQI / Grove (échelle 0–300, style référence) */
  airQualityIndex: {
    min: 0,
    max: 300,
    ticks: [0, 40, 80, 100, 140, 180, 220, 260, 300],
    warn: 100,
    danger: 150,
    legend: [
      "0–100 : bon · 100–150 : modéré",
      "> 150 : seuil d’alerte (aérer / vérifier capteurs)",
    ],
  } satisfies MetricThresholds,

  /** CO₂ (ppm), jauge 400–2000 */
  co2ppm: {
    min: 400,
    max: 2000,
    ticks: [400, 800, 1200, 1600, 2000],
    warn: 1000,
    danger: 1500,
    legend: [
      "< 1000 ppm : acceptable",
      "1000–1500 ppm : aérer · > 1500 ppm : alerte",
    ],
  } satisfies MetricThresholds,

  /** PM2.5 (µg/m³), OMS indicatif */
  pm25: {
    min: 0,
    max: 100,
    ticks: [0, 20, 40, 60, 80, 100],
    warn: 25,
    danger: 50,
    legend: [
      "< 25 µg/m³ : bon · 25–50 : modéré",
      "> 50 µg/m³ : alerte qualité de l’air",
    ],
  } satisfies MetricThresholds,

  /** PM10 (µg/m³) */
  pm10: {
    min: 0,
    max: 150,
    ticks: [0, 30, 60, 90, 120, 150],
    warn: 50,
    danger: 100,
    legend: [
      "< 50 µg/m³ : bon · 50–100 : modéré",
      "> 100 µg/m³ : alerte",
    ],
  } satisfies MetricThresholds,

  /** Humidité relative (%) */
  humidityPct: {
    min: 0,
    max: 100,
    ticks: [0, 20, 40, 60, 80, 100],
    warn: 35,
    danger: 30,
    legend: [
      "Zone confort ~ 40–60 %",
      "< 30 % ou > 70 % : risque inconfort / moisissures",
    ],
  } satisfies MetricThresholds,

  /** Température (°C), plage confort indicative */
  temperatureC: {
    min: 10,
    max: 35,
    ticks: [10, 15, 20, 25, 30, 35],
    warn: 26,
    danger: 28,
    legend: [
      "19–26 °C : confort typique",
      "> 28 °C ou < 16 °C : alerte confort",
    ],
  } satisfies MetricThresholds,
} as const;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/** Pour l’humidité : trop bas ou trop haut déclenche warn/danger (symétrique). */
export function humidityAlertLevel(value: number): AlertLevel {
  if (value < THRESHOLDS.humidityPct.danger || value > 100 - THRESHOLDS.humidityPct.danger) return "danger";
  if (value < THRESHOLDS.humidityPct.warn || value > 100 - THRESHOLDS.humidityPct.warn) return "warn";
  return "ok";
}

/** Température : hors plage confort */
export function temperatureAlertLevel(value: number): AlertLevel {
  if (value < 16 || value > 28) return "danger";
  if (value < 19 || value > 26) return "warn";
  return "ok";
}

export function alertLevelLinear(
  value: number,
  t: MetricThresholds,
  options?: { invert?: boolean }
): AlertLevel {
  const v = clamp(value, t.min, t.max);
  if (options?.invert) {
    if (v <= t.danger) return "danger";
    if (v <= t.warn) return "warn";
    return "ok";
  }
  if (v >= t.danger) return "danger";
  if (v >= t.warn) return "warn";
  return "ok";
}

export function alertLevelForMetric(
  metric: keyof typeof THRESHOLDS,
  value: number
): AlertLevel {
  const t = THRESHOLDS[metric];
  if (metric === "humidityPct") return humidityAlertLevel(value);
  if (metric === "temperatureC") return temperatureAlertLevel(value);
  return alertLevelLinear(value, t);
}

export function alertLabel(level: AlertLevel): string {
  switch (level) {
    case "ok":
      return "Normal";
    case "warn":
      return "Attention";
    case "danger":
      return "Alerte";
    default:
      return "";
  }
}
