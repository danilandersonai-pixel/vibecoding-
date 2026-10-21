import { expect, test, type Page } from '@playwright/test'
import day from '../content/days/day-01.json' with { type: 'json' }

type Node = { text: string; choices: { label: string; next: string }[]; ending?: string }

// Кратчайший путь по ситуации до хорошей концовки — подписи кнопок по порядку.
function goodPath(start: string, nodes: Record<string, Node>): string[] {
  const queue: { id: string; path: string[] }[] = [{ id: start, path: [] }]
  const seen = new Set<string>()
  while (queue.length) {
    const { id, path } = queue.shift()!
    if (nodes[id].ending === 'good') return path
    if (seen.has(id)) continue
    seen.add(id)
    for (const c of nodes[id].choices) queue.push({ id: c.next, path: [...path, c.label] })
  }
  throw new Error('В ситуации нет хорошей концовки')
}

async function block(page: Page, title: string) {
  return page.locator('.block').filter({ has: page.getByRole('heading', { name: title }) })
}

test('прохождение дня 1: день пройден, серия = 1', async ({ page }) => {
  await page.goto('/#/day/1')

  const diagram = day.blocks.find((b) => b.type === 'diagram') as { hotspots: { title: string; text: string }[] }
  const kitchen = diagram.hotspots.find((h) => /Кухня/.test(h.title))!
  await page.getByRole('button', { name: kitchen.title }).click()
  await expect(page.getByText(kitchen.text)).toBeVisible()

  const sort = day.blocks.find((b) => b.type === 'trainer' && 'kind' in b && b.kind === 'sort') as {
    title: string
    buckets: { id: string; label: string }[]
    items: { text: string; bucket: string }[]
  }
  const sortBlock = await block(page, sort.title)
  for (const item of sort.items) {
    const label = sort.buckets.find((b) => b.id === item.bucket)!.label
    await sortBlock.getByRole('group', { name: `Куда отнести: ${item.text}` }).getByRole('button', { name: label, exact: true }).click()
  }
  await sortBlock.getByRole('button', { name: 'Проверить' }).click()
  await expect(sortBlock.getByText('Всё разложено верно.')).toBeVisible()

  const scenario = day.blocks.find((b) => b.type === 'scenario') as { title: string; start: string; nodes: Record<string, Node> }
  const scenarioBlock = await block(page, scenario.title)
  for (const label of goodPath(scenario.start, scenario.nodes)) await scenarioBlock.getByRole('button', { name: label, exact: true }).click()
  await expect(scenarioBlock.getByText('Хороший исход.')).toBeVisible()

  const questions = page.getByTestId('quiz-question')
  for (const [i, q] of day.quiz.entries()) await questions.nth(i).getByRole('button').nth(q.correct).click()
  await expect(page.getByTestId('quiz-result')).toContainText(`Результат: ${day.quiz.length} из ${day.quiz.length}`)

  for (const step of day.practice) await page.getByRole('checkbox', { name: step.title }).check()
  await page.getByRole('checkbox', { name: 'Наставник принял день' }).check()

  await page.getByRole('link', { name: 'К карте' }).first().click()
  await expect(page.getByTestId('day-card').first()).toContainText('пройден')
  await expect(page.getByLabel('Итоги курса')).toContainText('1день подряд')
})
