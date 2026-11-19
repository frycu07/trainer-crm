import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// proxy zamiast CORS: przegladarka widzi jeden adres, a /api trafia do backendu
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": process.env.API_URL || "http://localhost:3000"
    }
  }
});
