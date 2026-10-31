import { configDefaults, defineConfig } from "vitest/config";

// Vitest запускает модульные тесты (npm test). В e2e/ — сквозные тесты Playwright, их запускает npx playwright test.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
