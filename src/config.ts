export const APP_CONFIG = {
  apiBase: import.meta.env.VITE_APP_SCRIPT_URL ?? "",
  token: import.meta.env.VITE_APP_TOKEN ?? ""
};

export const defaultHeaders: HeadersInit = {
  "Content-Type": "application/json"
};

