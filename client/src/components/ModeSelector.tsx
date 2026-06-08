import "./ModeSelector.css";

type Mode = "device" | "simulation";

type Props = {
  mode: Mode;
  onSelect: (m: Mode) => void;
  connected: boolean;
};

export function ModeSelector({ mode, onSelect, connected }: Props) {
  return (
    <div className="mode-selector">
      <button
        className={`mode-btn ${mode === "device" ? "mode-btn--active" : ""}`}
        onClick={() => onSelect("device")}
      >
        <span className="mode-btn__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </span>
        <span className="mode-btn__label">Raspberry Pi</span>
        {mode === "device" && (
          <span className={`mode-btn__status ${connected ? "mode-btn__status--on" : "mode-btn__status--off"}`}>
            {connected ? "Connecté" : "Hors ligne"}
          </span>
        )}
      </button>

      <button
        className={`mode-btn ${mode === "simulation" ? "mode-btn--active" : ""}`}
        onClick={() => onSelect("simulation")}
      >
        <span className="mode-btn__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </span>
        <span className="mode-btn__label">Simulation</span>
        {mode === "simulation" && (
          <span className="mode-btn__status mode-btn__status--sim">Actif</span>
        )}
      </button>
    </div>
  );
}
