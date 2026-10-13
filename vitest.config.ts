import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "node",
    pool: "vmThreads",
    maxWorkers: 1,
    exclude: ["**/node_modules/**", "**/.git/**", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/{ev-engine,odds-utils,opportunities,subscription,arbitrage,middles,sgp,kelly,clv,alerts,earnings,performance,promos,book-tracker,feed-quality,auth-redirect,game-catalog}.ts"],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
      exclude: ["lib/**/*.test.ts", "lib/supabase/**", "lib/stripe.ts"],
    },
  },
});
