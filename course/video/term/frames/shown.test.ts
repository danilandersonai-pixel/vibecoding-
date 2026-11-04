import { describe, expect, it } from 'vitest'
import { ctx } from './fixture'
import { shownLines } from './shown'

// Что увидит зритель: строки записи в кадре — по тем же планам, что рисуют кадры (диапазоны, консоль как в DevTools).
const S = 'fixture'

describe('shownLines', () => {
  it('Terminal: команда с подсказкой и показанные строки вывода; у browser — только строки server из диапазона', () => {
    const lines = shownLines(
      {
        type: 'terminal',
        items: [
          { session: S, event: 'fail', at: 0, lines: [2, 3] },
          { session: S, event: 'save', at: 1, lines: [3, 3] },
        ],
      },
      ctx,
    )
    expect(lines).toEqual(['~/trainer-app $ npm test', '✗ 1 тест не прошёл', 'Ошибка: вес должен быть числом', ' POST /api/sets 400 in 10ms'])
  })

  it('Browser: строки страницы и сообщения консоли так, как их показывает DevTools', () => {
    const lines = shownLines({ type: 'browser', session: S, event: 'form', console: true, consoleLines: [1, 2], at: { page: 0 } }, ctx)
    expect(lines).toEqual(expect.arrayContaining(['Тренировка', 'Сохранить подход', '[HMR] connected']))
    expect(lines).toContain('Download the React DevTools for a better development experience: https://react.dev/link/react-devtools')
    expect(lines.join('\n')).not.toContain('%c')
    expect(lines).not.toContain('Slow network is detected.')
  })

  it('Editor и Diff: показанные строки файла и диффа', () => {
    expect(shownLines({ type: 'editor', session: S, event: 'page', lines: [3, 4] }, ctx)).toEqual(['export default function Page() {', '  // вес в килограммах'])
    expect(shownLines({ type: 'diff', items: [{ session: S, event: 'route', at: 0, lines: [1, 2] }] }, ctx)).toEqual(['@@ -0,0 +1,4 @@', '+export async function GET() {'])
  })

  it('Agent: запрос, строки шагов и ответ; GitLog: хеш и сообщение', () => {
    const agent = shownLines({ type: 'agent', session: S, event: 'ask', at: { prompt: 0, steps: [1], reply: 2 } }, ctx)
    expect(agent[0]).toBe('Добавь проверку веса')
    expect(agent).toContain('Edited app/page.tsx (+3 −1)')
    expect(agent[agent.length - 1]).toBe('Готово')
    expect(shownLines({ type: 'gitlog', rows: [{ session: S, event: 'c1', at: 0 }] }, ctx)).toEqual(['abc1234 Первое сохранение'])
  })

  it('кадры без записей — пусто: их текст пишет автор', () => {
    expect(shownLines({ type: 'board', title: 'Доска', cards: [{ title: 'А', text: ['б'], at: 0 }] }, ctx)).toEqual([])
    expect(shownLines({ type: 'agenda' }, ctx)).toEqual([])
  })

  it('неверная ссылка на запись не роняет: показано то, что кадр смог собрать', () => {
    expect(shownLines({ type: 'terminal', items: [{ session: S, event: 'нет', at: 0 }] }, ctx)).toEqual([])
  })
})
