import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    target: "es2020",
    sourcemap: false,
    // three.js lives in its own lazy chunk (loaded only by the WebGL scenes)
    chunkSizeWarningLimit: 1000,
  },
});
