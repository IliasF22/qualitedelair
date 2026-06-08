import { useId, useLayoutEffect, useRef, useState } from "react";
import type { AlertLevel, MetricThresholds } from "../constants/thresholds";
import "./RadialGauge.css";

type RadialGaugeProps = {
  title: string;
  value: number | null | undefined;
  unit: string;
  thresholds: MetricThresholds;
  alertLevel: AlertLevel;
  formatCenter?: (v: number) => string;
  sensorError?: boolean;
};

const ARC_START = 225;
const ARC_SWEEP = 270;
const ARC_END = ARC_START - ARC_SWEEP;

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = degToRad(angleDeg);
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number, sweep: 0 | 1) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const diff = ((startDeg - endDeg + 360) % 360);
  const largeArc: 0 | 1 = diff > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

function valueToAngle(value: number, min: number, max: number) {
  const t = max === min ? 0 : (value - min) / (max - min);
  const clamped = Math.min(1, Math.max(0, t));
  return ARC_START - clamped * ARC_SWEEP;
}

const LEVEL_COLORS: Record<AlertLevel, { arc: string; glow: string }> = {
  ok: { arc: "#37c4ef", glow: "rgba(55, 196, 239, 0.55)" },
  warn: { arc: "#fbbf24", glow: "rgba(251, 191, 36, 0.5)" },
  danger: { arc: "#ef4444", glow: "rgba(239, 68, 68, 0.55)" },
};

export function RadialGauge({
  title,
  value,
  unit,
  thresholds,
  alertLevel,
  formatCenter,
  sensorError,
}: RadialGaugeProps) {
  const filterId = useId().replace(/:/g, "");
  const pathRef = useRef<SVGPathElement | null>(null);
  const [arcLen, setArcLen] = useState(0);

  const hasError = sensorError || value == null;
  const { min, max, ticks } = thresholds;
  const v = hasError ? min : Math.min(max, Math.max(min, value));
  const t = max === min ? 0 : (v - min) / (max - min);
  const angleNeedle = valueToAngle(v, min, max);

  const size = 200;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const rTrack = 76;
  const rInnerLabels = rTrack - 20;
  const stroke = 11;

  const fullArcPath = describeArc(cx, cy, rTrack, ARC_START, ARC_END, 1);

  useLayoutEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    setArcLen(len);
  }, [fullArcPath]);

  const needleLen = rTrack - 2;
  const tip = polar(cx, cy, needleLen, angleNeedle);
  const left = polar(cx, cy, 9, angleNeedle + 90);
  const right = polar(cx, cy, 9, angleNeedle - 90);

  const colors = hasError ? { arc: "#4a5568", glow: "rgba(74, 85, 104, 0.3)" } : LEVEL_COLORS[alertLevel];
  const centerText = hasError ? "—" : (formatCenter ? formatCenter(v) : String(Math.round(v * 10) / 10));

  const dashVisible = arcLen > 0 ? arcLen * (hasError ? 0 : t) : 0;

  return (
    <div className={`radial-gauge ${hasError ? "radial-gauge--error" : ""}`}>
      <h3 className="radial-gauge__title">{title}</h3>
      <div className="radial-gauge__svg-wrap">
        <svg
          className="radial-gauge__svg"
          width={size}
          height={size * 0.88}
          viewBox={`0 0 ${size} ${size * 0.88}`}
          aria-hidden
        >
          <defs>
            <filter id={`glow-${filterId}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            ref={pathRef}
            className="radial-gauge__track"
            d={fullArcPath}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          <path
            className="radial-gauge__value-arc"
            d={fullArcPath}
            fill="none"
            stroke={colors.arc}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dashVisible} ${arcLen || 1}`}
            filter={hasError ? undefined : `url(#glow-${filterId})`}
          />

          {ticks.map((tick) => {
            const p = polar(cx, cy, rInnerLabels, valueToAngle(tick, min, max));
            const dimmed = hasError || tick > v;
            return (
              <text
                key={tick}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`radial-gauge__tick ${dimmed ? "radial-gauge__tick--dim" : ""}`}
              >
                {tick}
              </text>
            );
          })}

          {!hasError && (
            <>
              <polygon
                className="radial-gauge__needle"
                points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
              />
              <circle className="radial-gauge__hub" cx={cx} cy={cy} r={8} />
            </>
          )}

          {hasError && (
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              className="radial-gauge__error-icon"
            >
              ⚠
            </text>
          )}
        </svg>
      </div>
      <div className="radial-gauge__center-readout">
        <span className={`radial-gauge__center-value ${hasError ? "radial-gauge__center-value--error" : ""}`}>
          {centerText}
        </span>
        {!hasError && <span className="radial-gauge__center-unit">{unit}</span>}
      </div>
      <div className={`radial-gauge__badge radial-gauge__badge--${hasError ? "error" : alertLevel}`}>
        {hasError && "Capteur indisponible"}
        {!hasError && alertLevel === "ok" && "Dans les seuils"}
        {!hasError && alertLevel === "warn" && "Attention"}
        {!hasError && alertLevel === "danger" && "Alerte"}
      </div>
      <ul className="radial-gauge__legend">
        {thresholds.legend.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
