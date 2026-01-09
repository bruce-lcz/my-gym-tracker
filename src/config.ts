const scriptUrl = import.meta.env.VITE_APP_SCRIPT_URL || "";

export const APP_CONFIG = {
  // 在開發模式下，將 https://script.google.com 替換為 /api 以使用代理
  apiBase: import.meta.env.DEV
    ? scriptUrl.replace("https://script.google.com", "/api")
    : scriptUrl,
  token: import.meta.env.VITE_APP_TOKEN ?? ""
};

export const defaultHeaders: HeadersInit = {
  "Content-Type": "text/plain;charset=utf-8"
};

