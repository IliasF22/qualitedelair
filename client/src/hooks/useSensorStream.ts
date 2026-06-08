import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getBackendUrl } from "../lib/apiBase";
import type { SensorSnapshot } from "../types";

function getSocketUrl(): string {
  const backend = getBackendUrl();
  if (backend) return backend;
  return typeof window !== "undefined" ? window.location.origin : "";
}

/** Timeout (ms) sans données avant de considérer la source comme déconnectée */
const STALE_TIMEOUT = 15_000;

export function useSensorStream() {
  const [snapshot, setSnapshot] = useState<SensorSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReceived, setLastReceived] = useState<number>(0);
  const [stale, setStale] = useState(false);

  const staleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function resetStaleTimer() {
    if (staleTimer.current) clearTimeout(staleTimer.current);
    setStale(false);
    staleTimer.current = setTimeout(() => setStale(true), STALE_TIMEOUT);
  }

  useEffect(() => {
    const url = getSocketUrl();
    const socket: Socket = io(url, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) => {
      setError(err.message || "Connexion impossible");
      setConnected(false);
    });
    socket.on("sensor:update", (data: SensorSnapshot) => {
      setSnapshot(data);
      setLastReceived(Date.now());
      resetStaleTimer();
    });

    return () => {
      socket.disconnect();
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, []);

  return { snapshot, connected, error, lastReceived, stale };
}
