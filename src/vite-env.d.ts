/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_WEATHER_KEY: string;
  readonly VITE_GOOGLE_MAP_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
