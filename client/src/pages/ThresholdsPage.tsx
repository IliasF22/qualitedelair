import { THRESHOLDS } from "../constants/thresholds";
import "./ThresholdsPage.css";

const SECTIONS: {
  key: keyof typeof THRESHOLDS;
  title: string;
  sensor: string;
  rationale: string;
}[] = [
  {
    key: "airQualityIndex",
    title: "Indice qualité de l’air (Grove)",
    sensor: "Grove Air Quality v1.3",
    rationale:
      "Échelle type AQI sur 0–300 : au-delà de 100 la qualité se dégrade, au-delà de 150 il est recommandé d’aérer ou de vérifier l’environnement. Aligné sur l’usage courant des indices « air quality index ».",
  },
  {
    key: "co2ppm",
    title: "Dioxyde de carbone (CO₂)",
    sensor: "Grove CO₂",
    rationale:
      "En intérieur, des taux sous 1000 ppm sont souvent considérés comme acceptables ; au-delà de 1000–1500 ppm la concentration peut nuire à la concentration et indique un manque de renouvellement d’air (références courantes en bâtiment / confort).",
  },
  {
    key: "pm25",
    title: "Particules PM2.5",
    sensor: "HM2201",
    rationale:
      "Seuils indicatifs proches des guides OMS (bon en dessous de 25 µg/m³ en moyenne sur 24 h, à titre indicatif). Au-delà de 25 µg/m³ : surveillance ; au-delà de 50 µg/m³ : qualité dégradée.",
  },
  {
    key: "pm10",
    title: "Particules PM10",
    sensor: "HM2201",
    rationale:
      "Seuils indicatifs pour les particules grossières : bon en dessous de 50 µg/m³, modéré jusqu’à 100 µg/m³, au-delà alerte (qualité de l’air extérieur / poussières).",
  },
  {
    key: "humidityPct",
    title: "Humidité relative",
    sensor: "DHT11",
    rationale:
      "Zone de confort courante autour de 40–60 %. En dessous de 30 % ou au-dessus de 70 % : inconfort et risques (sécheresse / moisissures selon le contexte).",
  },
  {
    key: "temperatureC",
    title: "Température",
    sensor: "DHT11",
    rationale:
      "Plage de confort intérieur souvent citée entre 19 et 26 °C ; en dehors de 16–28 °C on signale un risque d’inconfort thermique pour l’affichage du projet.",
  },
];

export function ThresholdsPage() {
  return (
    <div className="thresholds-page">
      <p className="thresholds-intro">
        Les seuils du dashboard servent à colorer les jauges (vert / ambre / rouge).
        Ce sont des <strong>repères pédagogiques</strong> pour le projet ESIEE-IT, pas
        des normes légales. Les références ci-dessous expliquent l’esprit de chaque
        choix.
      </p>

      <div className="thresholds-grid">
        {SECTIONS.map(({ key, title, sensor, rationale }) => {
          const t = THRESHOLDS[key];
          return (
            <article key={key} className="threshold-card">
              <h2 className="threshold-card__title">{title}</h2>
              <p className="threshold-card__sensor">Capteur : {sensor}</p>
              <dl className="threshold-card__nums">
                <div>
                  <dt>Plage affichée</dt>
                  <dd>
                    {t.min} → {t.max}
                    {key === "co2ppm"
                      ? " ppm"
                      : key === "humidityPct"
                        ? " %"
                        : key === "temperatureC"
                          ? " °C"
                          : key === "airQualityIndex"
                            ? " pts"
                            : " µg/m³"}
                  </dd>
                </div>
                <div>
                  <dt>Attention (ambre)</dt>
                  <dd>
                    {key === "humidityPct"
                      ? "sous 35 % ou au-dessus de 65 %"
                      : key === "temperatureC"
                        ? "hors plage 19–26 °C (transition)"
                        : `seuil « warn » : ${t.warn}`}
                  </dd>
                </div>
                <div>
                  <dt>Alerte (rouge)</dt>
                  <dd>
                    {key === "humidityPct"
                      ? "sous 30 % ou au-dessus de 70 %"
                      : key === "temperatureC"
                        ? "sous 16 °C ou au-dessus de 28 °C"
                        : `seuil « danger » : ${t.danger}`}
                  </dd>
                </div>
              </dl>
              <ul className="threshold-card__legend">
                {t.legend.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="threshold-card__why">{rationale}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
