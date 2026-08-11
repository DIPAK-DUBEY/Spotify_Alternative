import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020"
  },
  server: {
    proxy: {
      "/api": "http://localhost:4173"
    }
  },
  preview: {
    proxy: {
      "/api": "http://localhost:4173"
    }
  }
});
