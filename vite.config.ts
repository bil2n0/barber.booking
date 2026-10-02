import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const __dirname = import.meta.dirname

export default defineConfig({
  // Relative base + HashRouter => works under https://<user>.github.io/<repo>/
  base: "./",
  plugins: [react()],
  server: { port: 3000 },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
})
