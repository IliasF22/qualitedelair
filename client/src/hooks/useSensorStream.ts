import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getBackendUrl } from "../lib/apiBase";
import type { SensorSnapshot } from "../types";

function getSocketUrl(): string {
  const backend = getBackendUrl();
  if (backend) return backend;
  return typeof window !== "undefined" ? window.location.origin : "";
}

export function useSensorStream() {
  const [snapshot, setSnapshot] = useState<SensorSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { snapshot, connected, error };
}
