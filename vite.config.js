import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Match `npm run backend` when PORT is set in backend/.env (Flask default in code is 5000). */
function flaskPortFromBackendEnv() {
  try {
    const envFile = path.join(__dirname, "backend", ".env");
    const text = fs.readFileSync(envFile, "utf8");
    const m = text.match(/^\s*PORT\s*=\s*(\d+)/m);
    if (m) return m[1];
  } catch {
    /* no readable backend/.env */
  }
  return "5000";
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxy =
    env.VITE_API_PROXY_TARGET ||
    `http://127.0.0.1:${flaskPortFromBackendEnv()}`;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiProxy,
          changeOrigin: true,
        },
      },
    },
  };
});
