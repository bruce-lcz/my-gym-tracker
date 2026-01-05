export const APP_CONFIG = {
  apiBase: import.meta.env.DEV
    ? "/api/macros/s/AKfycbyA3w7KUn81m5oUdavrIhJhVJHXHkISS1zuuwLXPW00oxwBWf7DovxY8WrFiXeiFgyg/exec"
    : import.meta.env.VITE_APP_SCRIPT_URL ?? "",
  token: import.meta.env.VITE_APP_TOKEN ?? ""
};

export const defaultHeaders: HeadersInit = {
  "Content-Type": "text/plain;charset=utf-8"
};

