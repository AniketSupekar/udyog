
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "https://nursery-app-iin1.onrender.com",
        changeOrigin: true
      }
    }
  }
});

//http://localhost:5000