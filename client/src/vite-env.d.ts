/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL du backend HTTPS (ex. https://ton-api.onrender.com) — obligatoire si le site est sur Netlify */
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
