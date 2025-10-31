import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    // Définir les variables d'environnement pour le build
    "process.env": JSON.stringify(process.env),
  },
  optimizeDeps: {
    exclude: ["@babel/plugin-transform-runtime"],
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: "0.0.0.0", // Permettre l'accès depuis le réseau
  },
});
