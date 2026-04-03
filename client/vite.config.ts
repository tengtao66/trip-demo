import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  envDir: "..",
  server: {
    proxy: {
      "/api": { target: `http://localhost:${process.env.PORT || 3001}`, changeOrigin: true },
    },
  },
});
