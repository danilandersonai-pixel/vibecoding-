import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Прокрутки в jsdom нет: его window.scrollTo только пишет «Not implemented», а scrollIntoView отсутствует.
// Пустые заглушки убирают шум из вывода тестов; шпион vi.spyOn ставится поверх них.
window.scrollTo = () => {}
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}

afterEach(() => cleanup())
