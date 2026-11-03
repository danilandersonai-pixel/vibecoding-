import { configDefaults, defineConfig } from "vitest/config";

// Vitest запускает модульные тесты (npm test). В e2e/ — сквозные тесты Playwright, их запускает npx playwright test.
// tsconfigPaths: импорты «@/…», как в tsconfig.json, — так тест может вызвать маршрут приложения
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
