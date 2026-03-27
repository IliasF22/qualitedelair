/**
 * URL du backend (Express + Socket.io). En prod (Netlify), définir `VITE_BACKEND_URL`
 * vers l’URL HTTPS du serveur (ex. Render). En local, laisser vide : proxy Vite ou même origine.
 */
export function getBackendUrl(): string {
  const fromEnv =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    "";
  return String(fromEnv).replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const base = getBackendUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
