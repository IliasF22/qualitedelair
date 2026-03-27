import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SensorSnapshot } from "../types";

export type SourceMode = "simulation" | "raspberry";

const STORAGE_KEY = "air-quality-source-mode";

type Resolved = {
  snapshot: SensorSnapshot | null;
  /** true = pas de jauges (message ou attente) */
  blocked: boolean;
  message: string | null;
};

type SourcePreferenceContextValue = {
  sourceMode: SourceMode;
  setSourceMode: (m: SourceMode) => void;
  resolveSnapshot: (s: SensorSnapshot | null) => Resolved;
};

const SourcePreferenceContext = createContext<SourcePreferenceContextValue | null>(
  null
);

function loadMode(): SourceMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "simulation" || v === "raspberry") return v;
  } catch {
    /* ignore */
  }
  return "simulation";
}

function resolveSnapshot(snapshot: SensorSnapshot | null, mode: SourceMode): Resolved {
  if (!snapshot) {
    return { snapshot: null, blocked: true, message: null };
  }
  if (mode === "simulation") {
    if (snapshot.source === "mock") {
      return { snapshot, blocked: false, message: null };
    }
    return {
      snapshot: null,
      blocked: true,
      message:
        "Le serveur envoie des données du Raspberry Pi. Sélectionnez « Raspberry Pi ESIEE-IT » pour les afficher.",
    };
  }
  if (snapshot.source === "device") {
    return { snapshot, blocked: false, message: null };
  }
  return {
    snapshot: null,
    blocked: true,
    message:
      "Raspberry Pi ESIEE-IT non connecté — aucune mesure « appareil » reçue. Choisissez « Simulation » pour des données fictives, ou lancez le script sur le Pi.",
  };
}

export function SourcePreferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sourceMode, setSourceModeState] = useState<SourceMode>(loadMode);

  const setSourceMode = useCallback((m: SourceMode) => {
    setSourceModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<SourcePreferenceContextValue>(
    () => ({
      sourceMode,
      setSourceMode,
      resolveSnapshot: (s) => resolveSnapshot(s, sourceMode),
    }),
    [sourceMode, setSourceMode]
  );

  return (
    <SourcePreferenceContext.Provider value={value}>
      {children}
    </SourcePreferenceContext.Provider>
  );
}

export function useSourcePreference() {
  const ctx = useContext(SourcePreferenceContext);
  if (!ctx) {
    throw new Error("useSourcePreference must be used within SourcePreferenceProvider");
  }
  return ctx;
}
