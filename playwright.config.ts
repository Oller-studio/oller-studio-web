import { defineConfig } from "@playwright/test";

// Runs against a real, already-running server — either the live site
// (default) or a preview/local URL via BASE_URL, never spins up its own
// server (the app needs a real Postgres connection + Clerk/PayPal keys,
// which CI doesn't have — see .github/workflows/ci.yml).
export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: process.env.BASE_URL ?? "https://www.oller.studio",
  },
  reporter: "list",
});
