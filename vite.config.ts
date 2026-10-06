import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    // Design and QA tools keep state and logs in the project root; they are not app code.
    watch: { ignored: ["**/.impeccable/**", "**/.gstack/**", "**/.claude/**", "**/Screenshots and BAUST Logo/**", "**/dist/**"] },
  },
  preview: { port: 4173, strictPort: true },
  build: {
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks cache across deploys; app code stays small.
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/, priority: 30 },
            { name: "ui", test: /node_modules[\\/](radix-ui|@radix-ui|@floating-ui|lucide-react)[\\/]/, priority: 20 },
            { name: "motion", test: /node_modules[\\/](gsap|@gsap)[\\/]/, priority: 20 },
            { name: "data", test: /node_modules[\\/](@tanstack)[\\/]/, priority: 20 },
            // Analytics (and the installations module only it uses) stays out: it loads lazily, and only in production.
            { name: "firebase", test: /node_modules[\\/](firebase|@firebase)[\\/](?!analytics|installations)/, priority: 20 },
          ],
        },
      },
    },
  },
});
