import { defineConfig, devices } from "@playwright/test";

// Сквозные тесты из e2e/ — в настоящем браузере, по приложению на http://localhost:3000.
// Если npm run dev уже запущен, тесты идут по нему; если нет — Playwright запустит его сам.
export default defineConfig({
  testDir: "e2e",
  reporter: "list",
  use: { baseURL: "http://localhost:3000" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
