import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { ProxyOptions } from "vite";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 會部署在 /my-gym-tracker/
  base: process.env.NODE_ENV === 'production' ? '/my-gym-tracker/' : '/',
  server: {
    host: '0.0.0.0', // 允許外部設備訪問
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://script.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
        },
      } as ProxyOptions
    }
  }
});

