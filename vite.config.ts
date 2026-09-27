import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Mux playback tokens are signed by server/index.ts (`npm run dev:api`).
    proxy: {
      "/api": `http://localhost:${process.env.API_PORT ?? 8787}`,
    },
  },
});
