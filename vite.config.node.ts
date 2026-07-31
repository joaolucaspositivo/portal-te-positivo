// Config de build STANDALONE (Docker / Node).
// Não usa o wrapper do Lovable — gera saída Nitro para Node em dist/.
// Uso: vite build --config vite.config.node.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: { port: Number(process.env.PORT ?? 3000), host: true },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    nitro({ config: { preset: "node-server" } }),
    viteReact(),
  ],
});
