// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { gitBlobHash } from './blob'
import { sessionProblems } from './check'
import { find, sessions } from './index'

const COURSE = fileURLToPath(new URL('../..', import.meta.url))

// Все файлы папки (путь от course/) рекурсивно: путь внутри папки через «/» → хеш blob, как у git.
function appBlobs(dir: string): Map<string, string> {
  const root = join(COURSE, dir)
  const blobs = new Map<string, string>()
  for (const path of readdirSync(root, { recursive: true, encoding: 'utf8' }).sort()) {
    const abs = join(root, path)
    if (statSync(abs).isFile()) blobs.set(path.split('\\').join('/'), gitBlobHash(readFileSync(abs)))
  }
  return blobs
}

test('записи сходятся между собой и с demo-app/app', () => {
  expect(sessionProblems(Object.values(sessions), appBlobs('../demo-app/app'))).toEqual([])
})

test('ошибка 400 видна в консоли, подсказка и сохранение — после правки', () => {
  const bad = find('s02-sets', 'save-bad', 'browser')
  expect(bad.network).toContainEqual(expect.objectContaining({ method: 'POST', status: 400 }))
  expect(bad.console.find((m) => m.type === 'error')?.text).toMatch(/400/)
  expect(bad.after.join('\n')).not.toContain('60 кг × 8')
  expect(find('s02-sets', 'ask-fix', 'agent').prompt).toContain(bad.console.find((m) => m.type === 'error')!.text)
  expect(find('s02-sets', 'save-hint', 'browser').after.join('\n')).toContain('Вес должен быть числом, например 60')
  const ok = find('s02-sets', 'save-ok', 'browser')
  expect(ok.after.join('\n')).toContain('60 кг × 8')
  expect(ok.console.filter((m) => m.type === 'error')).toEqual([])
})

test('страница по-русски: агент правит layout, вкладка называется «Тренировка»', () => {
  expect(find('s02-sets', 'ask-form', 'agent').steps).toEqual(['read-page', 'route', 'page', 'layout'])
  const layout = find('s02-sets', 'layout', 'file')
  expect(layout).toMatchObject({ path: 'app/layout.tsx', by: 'agent' })
  expect(layout.after).toContain('lang="ru"')
  expect(layout.after).toContain('title: "Тренировка"')
  for (const id of ['save-bad', 'save-hint', 'save-ok']) expect(find('s02-sets', id, 'browser').title).toBe('Тренировка')
})

test('git: слияние, выдуманная команда, ключ вне коммитов', () => {
  expect(find('s02-sets', 'merge', 'run').out.join('\n')).toContain('Fast-forward')
  expect(find('s02-sets', 'start-dev', 'run').code).not.toBe(0)
  expect(find('s02-sets', 'start-dev', 'run').out.join('\n')).toContain('Missing script')
  expect(find('s02-sets', 'ignored', 'run').out[0]).toMatch(/^\.gitignore:\d+:/)
  expect(find('s02-sets', 'status-env', 'run').out).toEqual([])
  expect(find('s01-start', 'claude-file', 'file').after).toMatch(/Next\.js 16[\s\S]*Нельзя/)
})

test('s03: расплывчатый запрос — чужие тренировки, ЦКОКФ — только свои, объём 1500', () => {
  const data = find('s03-spec', 'ck-data', 'file').after
  // «клиент → названия его тренировок» из lib/workouts.ts: client: "anna", name: "Ноги"
  const names: Record<string, string[]> = {}
  for (const [, client, name] of data.matchAll(/client: "(\w+)",\s+name: "([^"]+)"/g)) (names[client] ??= []).push(name)
  expect(Object.keys(names).sort()).toEqual(['anna', 'oleg'])
  expect(names.anna).toHaveLength(3)
  expect(names.oleg).toHaveLength(2)
  expect(data).toMatch(/CURRENT_CLIENT[^=]*= "anna"/)
  // «Ноги»: 3 подхода × 10 × 50 кг
  const legs = data.slice(data.indexOf('name: "Ноги"'), data.indexOf('id: 2'))
  expect(legs.match(/\{ weight: 50, reps: 10 \}/g)).toHaveLength(3)

  // расплывчатый запрос: таблица тренировок всех людей, имён из lib/workouts.ts в ней нет
  const vague = find('s03-spec', 'vague-view', 'browser').after.join('\n')
  expect(vague).toContain('Иван Петров')
  expect(data).not.toContain('Иван')
  expect(find('s03-spec', 'vague-status', 'run').out).toEqual(['?? app/trainings/'])
  expect(find('s03-spec', 'drop-vague', 'run').files).toContainEqual({ path: 'app/trainings/page.tsx', blob: null })

  // ЦКОКФ: три тренировки Анны, ни одной Олега
  const workouts = find('s03-spec', 'workouts-view', 'browser').after.join('\n')
  for (const name of names.anna) expect(workouts).toContain(name)
  for (const name of names.oleg) expect(workouts).not.toContain(name)
  expect(workouts).not.toContain('Объём')

  // объём: три подхода по 10 раз с весом 50 кг — 1500 кг
  const volume = find('s03-spec', 'volume-view', 'browser').after.join('\n')
  expect(volume).toContain('Объём: 1500 кг')
  expect(find('s03-spec', 'questions', 'agent').steps).toEqual(['q-idea', 'q-etalons'])
})

test('s03: шаги идут по таблице, эталоны без названий продуктов, три сценария в спецификации', () => {
  expect(sessions['s03-spec'].events.map((e) => e.id)).toEqual([
    ...['etalons', 'c-etalons', 'questions', 'q-idea', 'q-etalons', 'spec-file', 'c-spec', 'dev'],
    ...['ask-vague', 'vague-page', 'vague-view', 'vague-status', 'drop-vague'],
    ...['ask-ckokf', 'ck-spec', 'ck-data', 'ck-page', 'workouts-view'],
    ...['ask-volume', 'vol-fn', 'vol-page', 'volume-view', 'c-workouts'],
    ...['plan-coach', 'p-spec', 'p-data', 'log3'],
  ])
  expect(find('s03-spec', 'etalons', 'file')).toMatchObject({ path: 'docs/etalons.md', before: null })
  const etalons = find('s03-spec', 'etalons', 'file').after
  for (const name of ['Эталон А', 'Эталон Б', 'Эталон В']) expect(etalons).toContain(`## ${name}`)
  expect(etalons).toContain('## Что берём только как идею')
  const spec = find('s03-spec', 'spec-file', 'file').after
  expect(spec.match(/^### Сценарий [123]\. /gm)).toHaveLength(3)
  expect(spec.match(/^Готово: /gm)).toHaveLength(3)
  expect(find('s03-spec', 'ask-ckokf', 'agent').steps).toEqual(['ck-spec', 'ck-data', 'ck-page'])
  expect(find('s03-spec', 'ask-volume', 'agent').steps).toEqual(['vol-fn', 'vol-page'])
  expect(find('s03-spec', 'plan-coach', 'agent').steps).toEqual(['p-spec', 'p-data'])
})

test('s04: −5 сохраняется, правка ломает запятую, откат возвращает, тест сначала красный, потом зелёный', () => {
  const text = (id: string) => find('s04-rules', id, 'browser').after.join('\n')
  // -5 сохраняется: в списке «-5 кг × 8»
  expect(text('neg')).toContain('-5 кг × 8')
  // правка агента: вес больше нуля, но запятая потеряна — «62,5» перестало быть числом
  const fix = find('s04-rules', 'neg-fix', 'file')
  expect(fix).toMatchObject({ path: 'app/api/sets/route.ts', by: 'agent' })
  expect(fix.after).toContain('Number(weight)')
  expect(fix.after).toContain('> 0')
  expect(fix.after).not.toContain('toNumber(weight)')
  expect(text('neg-view')).toContain('Вес должен быть больше нуля')
  expect(text('comma')).toContain('Вес должен быть числом')
  // откат: коммит на main, route.ts вернулся к версии из s02
  const revert = find('s04-rules', 'revert', 'run')
  expect(revert.out[0]).toMatch(/^\[main /)
  expect(revert.files).toContainEqual({ path: 'app/api/sets/route.ts', blob: find('s02-sets', 'route', 'file').blob })
  expect(text('comma-ok')).toContain('62.5 кг × 8')
  // тест сначала красный (нет модуля), потом зелёный: пять тестов
  const red = find('s04-rules', 'test-red', 'run')
  expect(red.code).not.toBe(0)
  expect(red.out.join('\n')).toContain('weight')
  const green = find('s04-rules', 'test-green', 'run')
  expect(green.code).toBe(0)
  expect(green.out.join('\n')).toContain('5 passed')
  expect(find('s04-rules', 'test-all', 'run').code).toBe(0)
  // тот же разбор в route.ts и в lib/weight.ts: −5 отвергается, запятая работает
  expect(text('neg2')).toContain('Вес должен быть больше нуля')
  expect(text('comma2')).toContain('62.5 кг × 8')
  // системные шрифты: сети для сборки не нужно, предупреждений про Google Fonts в выводе сервера нет
  for (const e of sessions['s04-rules'].events) {
    if (e.kind === 'browser') expect(e.server.join('\n'), e.id).not.toMatch(/Google Fonts|fonts\.googleapis|font\/google/i)
  }
})

test('s04: шаги идут по таблице, шрифты правит человек, агент пишет тест раньше кода', () => {
  expect(sessions['s04-rules'].events.map((e) => e.id)).toEqual([
    ...['fonts', 'fonts-css', 'c-fonts', 'dev'],
    ...['neg', 'ask-neg', 'neg-fix', 'neg-view', 'c-neg', 'comma', 'log4', 'revert', 'comma-ok'],
    ...['vitest', 'ask-test', 'test-file', 'test-red', 'weight-file', 'test-green', 'route-weight'],
    ...['diff4', 'test-script', 'test-all', 'c-weight', 'neg2', 'comma2', 'log5'],
  ])
  const layout = find('s04-rules', 'fonts', 'file')
  expect(layout).toMatchObject({ path: 'app/layout.tsx' })
  expect(layout.by).toBeUndefined()
  expect(layout.before).toContain('next/font/google')
  expect(layout.after).not.toContain('next/font')
  const css = find('s04-rules', 'fonts-css', 'file')
  expect(css).toMatchObject({ path: 'app/globals.css' })
  expect(css.by).toBeUndefined()
  expect(css.before).toContain('--font-geist-sans')
  expect(css.after).not.toMatch(/geist/i)
  expect(find('s04-rules', 'c-fonts', 'commit').message).toBe('Системные шрифты: сборка без загрузки из сети')
  expect(find('s04-rules', 'ask-neg', 'agent').steps).toEqual(['neg-fix'])
  expect(find('s04-rules', 'ask-test', 'agent').steps).toEqual(['test-file', 'test-red', 'weight-file', 'test-green', 'route-weight'])
  // файл с тестом написан раньше файла с кодом
  const ids = sessions['s04-rules'].events.map((e) => e.id)
  expect(ids.indexOf('test-file')).toBeLessThan(ids.indexOf('weight-file'))
  expect(find('s04-rules', 'test-file', 'file')).toMatchObject({ path: 'lib/weight.test.ts', before: null, by: 'agent' })
  expect(find('s04-rules', 'weight-file', 'file')).toMatchObject({ path: 'lib/weight.ts', before: null, by: 'agent' })
  expect(find('s04-rules', 'route-weight', 'file').after).toContain('parseWeight')
  expect(find('s04-rules', 'c-weight', 'commit').message).toBe('Разбор веса в lib/weight.ts с тестами')
})
