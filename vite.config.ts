import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 會部署在 /my-gym-tracker/
  base: process.env.NODE_ENV === 'production' ? '/my-gym-tracker/' : '/',
  server: {
    host: '0.0.0.0', // 允許外部設備訪問
    port: 5173
  }
});

