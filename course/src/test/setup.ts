import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Прокрутки в jsdom нет: его window.scrollTo только пишет «Not implemented», а scrollIntoView отсутствует.
// Пустые заглушки убирают шум из вывода тестов; шпион vi.spyOn ставится поверх них.
// Тесты с `// @vitest-environment node` (рекордер сессий) идут без окна — заглушки им не нужны.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}
}

afterEach(() => cleanup())
