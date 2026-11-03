// @vitest-environment node
import { execFileSync } from 'node:child_process'
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

test('s05: ключ с NEXT_PUBLIC_ находится в сборке, после исправления — нет', () => {
  // ключ NEXT_PUBLIC_ читает клиентский компонент на /coach, поэтому сборка кладёт его значение в кусок .next/static
  const button = find('s05-proto', 'advice-btn', 'file')
  expect(button).toMatchObject({ path: 'app/coach/advice-button.tsx', by: 'agent' })
  expect(button.after).toMatch(/^"use client";/)
  expect(button.after).toContain('process.env.NEXT_PUBLIC_AI_KEY')
  expect(find('s05-proto', 'key-env', 'file').after).toContain('NEXT_PUBLIC_AI_KEY=demo-ai-key-not-real')
  const build = find('s05-proto', 'build', 'run')
  expect(build.code).toBe(0)
  const leak = find('s05-proto', 'leak', 'run')
  expect(leak.cmd).toBe('grep -rl demo-ai-key-not-real .next/static || echo "не найдено"')
  expect(leak.code).toBe(0)
  expect(leak.out[0]).toMatch(/^\.next\/static\/.+\.js$/)
  expect(leak.out).not.toContain('не найдено')
  // исправление: ключ только на сервере (AI_KEY читает маршрут /api/advice), кнопка ходит на свой маршрут
  expect(find('s05-proto', 'key-route', 'file')).toMatchObject({ path: 'app/api/advice/route.ts', before: null, by: 'agent' })
  expect(find('s05-proto', 'key-route', 'file').after).toContain('process.env.AI_KEY')
  const fixedEnv = find('s05-proto', 'key-env-fix', 'file')
  expect(fixedEnv).toMatchObject({ path: '.env.local', by: 'agent' })
  expect(fixedEnv.after).toContain('AI_KEY=demo-ai-key-not-real')
  expect(fixedEnv.after).not.toContain('NEXT_PUBLIC_')
  const fixedButton = find('s05-proto', 'key-btn-fix', 'file')
  expect(fixedButton.after).toContain('fetch("/api/advice"')
  expect(fixedButton.after).not.toContain('process.env')
  expect(find('s05-proto', 'build2', 'run').code).toBe(0)
  expect(find('s05-proto', 'leak2', 'run')).toMatchObject({ cmd: leak.cmd, out: ['не найдено'] })
  // ключ не попадает в коммиты: .env.local под .gitignore
  for (const e of sessions['s05-proto'].events) {
    if (e.kind === 'commit') expect(e.files.map((f) => f.path), e.id).not.toContain('.env.local')
  }

  // показ: шесть подопечных, затем «Пора написать» у двоих сверху (больше 7 дней без тренировки), остальные в прежнем порядке
  // Подопечный на странице: имя, пометка (если есть), «последняя тренировка: N дн. назад», «Совет ИИ»
  const clientsOf = (lines: string[]) =>
    lines.flatMap((line, i) => {
      const days = /^последняя тренировка: (\d+) дн\. назад$/.exec(line)
      if (!days) return []
      const marked = lines[i - 1] === 'Пора написать'
      return [{ name: lines[marked ? i - 2 : i - 1], days: Number(days[1]), marked }]
    })
  const before = find('s05-proto', 'proto-view', 'browser').after
  expect(before).not.toContain('Пора написать')
  const was = clientsOf(before)
  expect(was.map((c) => c.name)).toEqual(['Анна', 'Денис', 'Ксения', 'Олег', 'Павел', 'Татьяна'])
  expect(before.filter((line) => line === 'Совет ИИ')).toHaveLength(6)
  const after = find('s05-proto', 'proto-view2', 'browser').after
  expect(after.join('\n')).toContain('Пора написать')
  const now = clientsOf(after)
  expect(now).toHaveLength(6)
  expect(now.map((c) => c.marked)).toEqual(now.map((c) => c.days > 7))
  expect(now.map((c) => c.marked)).toEqual([true, true, false, false, false, false])
  expect(now.slice(2).map((c) => c.name)).toEqual(was.map((c) => c.name).filter((name) => !now.slice(0, 2).some((c) => c.name === name)))

  // ветки: прототип остаётся только в proto/coach, main возвращает приложение s04
  expect(find('s05-proto', 'main', 'run').files).toContainEqual({ path: 'app/coach/page.tsx', blob: null })
  const branches = find('s05-proto', 'branches', 'run').out.join('\n')
  expect(branches).toContain('proto/coach')
  expect(branches).toContain('main')
})

test('s05: шаги идут по таблице, документ и журнал пишет человек, прототип и ключ — агент', () => {
  expect(sessions['s05-proto'].events.map((e) => e.id)).toEqual([
    ...['proto-branch', 'proto-doc', 'ask-proto', 'fake-data', 'proto-page', 'c-proto'],
    ...['ask-advice', 'key-env', 'advice-btn', 'advice-use', 'build', 'leak'],
    ...['ask-key-fix', 'key-route', 'key-env-fix', 'key-btn-fix', 'build2', 'leak2', 'c-advice'],
    ...['dev', 'proto-view', 'ask-iter', 'iter-page', 'proto-view2', 'journal', 'c-proto2', 'main', 'branches'],
  ])
  expect(find('s05-proto', 'proto-branch', 'run')).toMatchObject({ cmd: 'git switch -c proto/coach', code: 0 })
  // docs/prototype.md: вопрос, таймбокс, тонкий срез, выдуманные данные, готовность выбросить, упрощения — и журнал решений после показа
  const doc = find('s05-proto', 'proto-doc', 'file')
  expect(doc).toMatchObject({ path: 'docs/prototype.md', before: null })
  expect(doc.by).toBeUndefined()
  expect(doc.after).toContain('Поймёт ли тренер с первого взгляда, кому пора написать?')
  for (const part of ['## Таймбокс', '## Тонкий срез', '## Данные', '## Готова выбросить', '## Упрощения', '## Журнал решений']) expect(doc.after).toContain(part)
  expect(doc.after).toContain('Два часа')
  const journal = find('s05-proto', 'journal', 'file')
  expect(journal).toMatchObject({ path: 'docs/prototype.md', before: doc.after })
  expect(journal.by).toBeUndefined()
  expect(journal.after).toContain('Пора написать')
  expect(journal.after).toContain('развивать: строить по-настоящему на базе в день 4')
  // запрос по шаблону s36: прототип, вопрос, один экран, выдуманные данные в памяти без входа и базы, стек, список упрощений
  const ask = find('s05-proto', 'ask-proto', 'agent')
  expect(ask.steps).toEqual(['fake-data', 'proto-page'])
  for (const part of ['прототип', 'Вопрос', 'Один экран', 'выдуман', 'в памяти', 'без входа и базы', 'Стек', 'список упрощений']) expect(ask.prompt.toLowerCase()).toContain(part.toLowerCase())
  expect(ask.reply).toContain('Упрощения')
  const data = find('s05-proto', 'fake-data', 'file')
  expect(data).toMatchObject({ path: 'lib/fake-clients.ts', before: null, by: 'agent' })
  expect(data.after.match(/lastWorkout: "\d{4}-\d\d-\d\d"/g)).toHaveLength(6)
  expect(find('s05-proto', 'proto-page', 'file')).toMatchObject({ path: 'app/coach/page.tsx', before: null, by: 'agent' })
  expect(find('s05-proto', 'proto-page', 'file').after).toContain('последняя тренировка:')
  expect(find('s05-proto', 'c-proto', 'commit')).toMatchObject({ message: 'Прототип: список подопечных', branch: 'proto/coach' })
  expect(find('s05-proto', 'ask-advice', 'agent').steps).toEqual(['key-env', 'advice-btn', 'advice-use'])
  expect(find('s05-proto', 'key-env', 'file')).toMatchObject({ path: '.env.local', by: 'agent', before: find('s02-sets', 'env', 'file').after })
  expect(find('s05-proto', 'advice-use', 'file')).toMatchObject({ path: 'app/coach/page.tsx', by: 'agent' })
  expect(find('s05-proto', 'ask-key-fix', 'agent').prompt).toContain('.next/static')
  expect(find('s05-proto', 'ask-key-fix', 'agent').steps).toEqual(['key-route', 'key-env-fix', 'key-btn-fix'])
  expect(find('s05-proto', 'c-advice', 'commit')).toMatchObject({ message: 'Совет ИИ: ключ только на сервере', branch: 'proto/coach' })
  expect(find('s05-proto', 'ask-iter', 'agent').steps).toEqual(['iter-page'])
  expect(find('s05-proto', 'iter-page', 'file')).toMatchObject({ path: 'app/coach/page.tsx', by: 'agent' })
  expect(find('s05-proto', 'c-proto2', 'commit')).toMatchObject({ message: 'Прототип: сверху те, кому пора написать', branch: 'proto/coach' })
  expect(find('s05-proto', 'main', 'run')).toMatchObject({ cmd: 'git switch main', code: 0 })
  // dev-сервер, браузер не нажимал «Совет ИИ»: запроса к сервису ИИ в записи нет
  for (const id of ['proto-view', 'proto-view2']) {
    const view = find('s05-proto', id, 'browser')
    expect(view.url).toBe('http://localhost:3000/coach')
    expect(view.network).toEqual([])
    expect(view.server.join('\n')).not.toMatch(/Google Fonts|fonts\.googleapis|font\/google/i)
  }
})

test('s06: без RLS чужой подопечный открывается, с RLS — нет', () => {
  const text = (id: string) => find('s06-auth', id, 'browser').after.join('\n')
  // Марина входит: форма «Почта» / «Пароль», «Войти» — и она на /clients, у неё Анна и Олег, Светы нет
  const login = find('s06-auth', 'login-marina', 'browser')
  expect(login.url).toBe('http://localhost:3000/login')
  expect(login.fields).toEqual([
    { label: 'Почта', value: 'marina@example.com' },
    { label: 'Пароль', value: 'demo-password' },
  ])
  expect(login.urlAfter).toMatch(/\/clients$/)
  expect(text('login-marina')).toContain('Анна')
  expect(text('login-marina')).toContain('Олег')
  expect(text('login-marina')).not.toContain('Света')
  // список фильтрует по тренеру, а карточка ищет только по id: по адресу /clients/3 открывается Света — подопечная Игоря
  expect(find('s06-auth', 'clients-page', 'file').after).toContain('where coach_id = $1')
  const card = find('s06-auth', 'client-page', 'file').after
  expect(card).toContain('where id = $1')
  expect(card).not.toContain('coach_id')
  expect(card).toContain('notFound()')
  expect(find('s06-auth', 'attack', 'browser').url).toBe('http://localhost:3000/clients/3')
  expect(text('attack')).toContain('Света')
  expect(find('s06-auth', 'attack', 'browser').network).toEqual([])
  // RLS: та же ссылка — «Подопечный не найден» (404), Светы на странице нет
  expect(find('s06-auth', 'attack2', 'browser').url).toBe('http://localhost:3000/clients/3')
  expect(text('attack2')).toContain('Подопечный не найден')
  expect(text('attack2')).not.toContain('Света')
  expect(find('s06-auth', 'attack2', 'browser').network).toContainEqual({ method: 'GET', url: 'http://localhost:3000/clients/3', status: 404 })
  // проверка в psql от имени Марины: строки 1 Анна и 2 Олег, Светы нет
  const check = find('s06-auth', 'rls-check', 'run')
  expect(check.code).toBe(0)
  expect(check.out.some((line) => /^\s*1 \| Анна\s*$/.test(line))).toBe(true)
  expect(check.out.some((line) => /^\s*2 \| Олег\s*$/.test(line))).toBe(true)
  expect(check.out.join('\n')).not.toContain('Света')
  // rowsecurity = t у всех четырёх таблиц
  const rows = find('s06-auth', 'rls-on', 'run').out.flatMap((line) => {
    const row = /^\s*(\w+)\s*\|\s*([tf])\s*$/.exec(line)
    return row ? [[row[1], row[2]]] : []
  })
  expect(rows).toEqual([['clients', 't'], ['profiles', 't'], ['sets', 't'], ['workouts', 't']])
  // тест на чужие данные проходит
  const testRun = find('s06-auth', 'rls-test-run', 'run')
  expect(testRun.code).toBe(0)
  expect(testRun.out.join('\n')).toContain('3 passed')
  // таблицы модели данных
  const tables = find('s06-auth', 'tables', 'run').out.flatMap((line) => {
    const row = /^\s*public\s*\|\s*(\w+)\s*\|\s*table\s*\|/.exec(line)
    return row ? [row[1]] : []
  })
  expect(tables).toEqual(['clients', 'profiles', 'sets', 'workouts'])
})

test('s06: шаги идут по таблице, миграции и тест пишет агент, проверку и .env.local — человек', () => {
  expect(sessions['s06-auth'].events.map((e) => e.id)).toEqual([
    ...['pg', 'pg-types', 'ask-schema', 'schema-file', 'seed-file', 'db-init', 'db-seed', 'tables'],
    ...['ask-login', 'db-lib', 'session-lib', 'login-route', 'login-page', 'clients-page', 'client-page', 'not-found'],
    ...['env-db', 'dev', 'login-marina', 'attack'],
    ...['ask-rls', 'rls-sql', 'rls-apply', 'as-marina-file', 'rls-check', 'attack2', 'rls-on'],
    ...['ask-rls-test', 'rls-test-file', 'rls-test-run', 'c-auth', 'log6'],
  ])
  expect(find('s06-auth', 'pg', 'run')).toMatchObject({ cmd: 'npm install pg', code: 0 })
  expect(find('s06-auth', 'pg-types', 'run')).toMatchObject({ cmd: 'npm install -D @types/pg', code: 0 })
  // модель данных и демо-данные: четыре таблицы без RLS, пять пользователей с хешем пароля
  expect(find('s06-auth', 'ask-schema', 'agent').steps).toEqual(['schema-file', 'seed-file'])
  const schema = find('s06-auth', 'schema-file', 'file')
  expect(schema).toMatchObject({ path: 'supabase/migrations/0001_init.sql', before: null, by: 'agent' })
  for (const table of ['profiles', 'clients', 'workouts', 'sets']) expect(schema.after).toContain(`create table ${table} (`)
  expect(schema.after).toContain('references auth.users')
  expect(schema.after).not.toMatch(/row level security/i)
  const seed = find('s06-auth', 'seed-file', 'file')
  expect(seed).toMatchObject({ path: 'supabase/seed.sql', before: null, by: 'agent' })
  expect(seed.after.match(/crypt\('demo-password', gen_salt\('bf'\)\)/g)).toHaveLength(5)
  for (const email of ['marina', 'igor', 'anna', 'oleg', 'sveta']) expect(seed.after).toContain(`'${email}@example.com'`)
  expect(find('s06-auth', 'db-init', 'run')).toMatchObject({ cmd: 'psql -f supabase/migrations/0001_init.sql', code: 0, out: Array(4).fill('CREATE TABLE') })
  const seeded = find('s06-auth', 'db-seed', 'run')
  expect(seeded).toMatchObject({ cmd: 'psql -f supabase/seed.sql', code: 0 })
  expect(seeded.out).toEqual(['INSERT 0 5', 'INSERT 0 5', 'INSERT 0 3', 'INSERT 0 5', 'INSERT 0 14'])
  // вход: запросы от имени вошедшего, как в Supabase; пароль сверяет crypt() от владельца базы
  expect(find('s06-auth', 'ask-login', 'agent').steps).toEqual(['db-lib', 'session-lib', 'login-route', 'login-page', 'clients-page', 'client-page', 'not-found'])
  const db = find('s06-auth', 'db-lib', 'file')
  expect(db).toMatchObject({ path: 'lib/db.ts', before: null, by: 'agent' })
  for (const part of ['process.env.DATABASE_URL', '"begin"', '"set local role authenticated"', "set_config('request.jwt.claims', $1, true)", '"commit"']) expect(db.after).toContain(part)
  expect(find('s06-auth', 'session-lib', 'file').after).toContain('createHmac("sha256"')
  expect(find('s06-auth', 'session-lib', 'file').after).toContain('httpOnly: true')
  const route = find('s06-auth', 'login-route', 'file')
  expect(route).toMatchObject({ path: 'app/api/login/route.ts', by: 'agent' })
  expect(route.after).toContain('crypt($2, u.encrypted_password)')
  expect(route.after).toContain('Неверная почта или пароль')
  expect(find('s06-auth', 'login-page', 'file').after).toMatch(/^"use client";/)
  expect(find('s06-auth', 'client-page', 'file').path).toBe('app/clients/[id]/page.tsx')
  expect(find('s06-auth', 'not-found', 'file')).toMatchObject({ path: 'app/clients/[id]/not-found.tsx', by: 'agent' })
  expect(find('s06-auth', 'not-found', 'file').after).toContain('Подопечный не найден')
  // .env.local дописывает человек; секрет заведомо ненастоящий, файл в коммиты не попадает
  const env = find('s06-auth', 'env-db', 'file')
  expect(env).toMatchObject({ path: '.env.local', before: find('s05-proto', 'key-env-fix', 'file').after })
  expect(env.by).toBeUndefined()
  expect(env.after).toContain('DATABASE_URL=postgresql://postgres@127.0.0.1:54322/postgres\nSESSION_SECRET=demo-secret-not-real-session\n')
  const commit = find('s06-auth', 'c-auth', 'commit')
  expect(commit).toMatchObject({ message: 'Вход для двух ролей, модель данных и RLS', branch: 'main' })
  expect(commit.files.map((f) => f.path)).not.toContain('.env.local')
  for (const path of ['supabase/migrations/0001_init.sql', 'supabase/migrations/0002_rls.sql', 'supabase/seed.sql', 'supabase/tests/as-marina.sql', 'test/rls.test.ts']) {
    expect(commit.files.map((f) => f.path)).toContain(path)
  }
  // RLS пишет и применяет агент (команда с вопросом [y / n]); политики через auth.uid(), без auth.jwt()
  expect(find('s06-auth', 'ask-rls', 'agent').steps).toEqual(['rls-sql', 'rls-apply'])
  const rls = find('s06-auth', 'rls-sql', 'file')
  expect(rls).toMatchObject({ path: 'supabase/migrations/0002_rls.sql', before: null, by: 'agent' })
  for (const table of ['profiles', 'clients', 'workouts', 'sets']) expect(rls.after).toContain(`alter table ${table} enable row level security;`)
  expect(rls.after).toContain('auth.uid()')
  expect(rls.after).not.toContain('auth.jwt()')
  for (const kind of ['select', 'insert', 'update']) expect(rls.after).toMatch(new RegExp(`on sets\\n  for ${kind} `))
  const apply = find('s06-auth', 'rls-apply', 'run')
  expect(apply).toMatchObject({ cmd: 'psql -f supabase/migrations/0002_rls.sql', code: 0, by: 'agent' })
  expect(apply.out.filter((line) => line === 'ALTER TABLE')).toHaveLength(4)
  expect(apply.out.join('\n')).not.toMatch(/ERROR|NOTICE/)
  // проверку от имени Марины пишет человек: uuid Марины из seed
  const asMarina = find('s06-auth', 'as-marina-file', 'file')
  expect(asMarina).toMatchObject({ path: 'supabase/tests/as-marina.sql', before: null })
  expect(asMarina.by).toBeUndefined()
  const marina = /\('([0-9a-f-]{36})', 'marina@example\.com'/.exec(seed.after)![1]
  expect(asMarina.after).toContain(`'{"sub":"${marina}"}'`)
  expect(asMarina.after).toMatch(/^begin;$[\s\S]*^set local role authenticated;$[\s\S]*^rollback;$/m)
  // тест: vitest в среде node, адрес базы — из окружения
  expect(find('s06-auth', 'ask-rls-test', 'agent').steps).toEqual(['rls-test-file', 'rls-test-run'])
  const test = find('s06-auth', 'rls-test-file', 'file')
  expect(test).toMatchObject({ path: 'test/rls.test.ts', before: null, by: 'agent' })
  expect(test.after).toMatch(/^\/\/ @vitest-environment node\n/)
  expect(find('s06-auth', 'rls-test-run', 'run')).toMatchObject({ cmd: 'npx vitest run test/rls.test.ts', by: 'agent' })
  expect(find('s06-auth', 'log6', 'run').out[0]).toMatch(/^[0-9a-f]{7} Вход для двух ролей, модель данных и RLS$/)
  // браузер без предупреждений Next в выводе сервера (cacheComponents: страницы с базой — instant = false)
  for (const id of ['login-marina', 'attack', 'attack2']) {
    const view = find('s06-auth', id, 'browser')
    expect(view.server.join('\n'), id).not.toMatch(/Error|uncached data|Suspense/)
    expect(view.console.filter((m) => m.type === 'error' && !m.text.includes('404')), id).toEqual([])
  }
})

test('s07: дата как у большинства, затем по-русски; тест ловит поломку; сквозной тест проходит', () => {
  const text = (id: string) => find('s07-cycle', id, 'browser').after.join('\n')
  // Марина назначает «Грудь и спина» на 2026-11-02: дата в списке — американская, с языком системы сервера
  const assign = find('s07-cycle', 'assign', 'browser')
  expect(assign.url).toBe('http://localhost:3000/clients/1')
  expect(assign.fields).toEqual([
    { label: 'Название', value: 'Грудь и спина' },
    { label: 'Дата', value: '2026-11-02' },
  ])
  expect(text('assign')).toContain('Грудь и спина')
  expect(text('assign')).toContain('11/2/2026')
  expect(find('s07-cycle', 'ask-date', 'agent').prompt).toContain('11/2/2026')
  // после formatDay — «2 ноября», американской даты нет
  expect(text('assign-view')).toContain('2 ноября')
  expect(text('assign-view')).not.toContain('11/2/2026')
  // Анна вписывает подход 60 × 8 в «Грудь и спина»: подход в списке, объём 480 кг
  const logSet = find('s07-cycle', 'log-set', 'browser')
  expect(logSet.before).toContain('Грудь и спина')
  expect(text('log-set')).toContain('60 кг × 8')
  expect(text('log-set')).toContain('480')
  expect(text('log-set')).toContain('Объём: 480 кг')
  // тест на объём зелёный; формула сломана — npm test красный, git restore вернул lib/volume.ts — зелёный
  expect(find('s07-cycle', 'volume-run', 'run').code).toBe(0)
  expect(find('s07-cycle', 'red', 'run').code).not.toBe(0)
  expect(find('s07-cycle', 'green', 'run').code).toBe(0)
  expect(find('s07-cycle', 'unbreak', 'run').files?.map((f) => f.path)).toContain('lib/volume.ts')
  // сквозной тест проходит
  const e2e = find('s07-cycle', 'e2e-run', 'run')
  expect(e2e.code).toBe(0)
  expect(e2e.out.join('\n')).toContain('1 passed')
})

test('s07: шаги идут по таблице, цикл и тесты пишет агент, поломку — человек', () => {
  expect(sessions['s07-cycle'].events.map((e) => e.id)).toEqual([
    ...['dev', 'ask-assign', 'assign-action', 'client-page2', 'workouts-db', 'workout-page', 'sets-action', 'volume-lib', 'drop-fake'],
    ...['stage', 'diff-stat', 'diff-assign', 'login-marina', 'assign'],
    ...['ask-date', 'dates-lib', 'date-use-1', 'date-use-2', 'assign-view', 'login-anna', 'log-set'],
    ...['ask-volume-test', 'volume-test', 'volume-run', 'break', 'red', 'unbreak', 'green', 'pw'],
    ...['ask-e2e', 'vitest-config', 'pw-config', 'e2e-file', 'e2e-ignore', 'e2e-run', 'c-cycle'],
  ])
  const file = (id: string) => find('s07-cycle', id, 'file')
  // основной цикл: действия и страницы пишет агент, запросы — от имени вошедшего (asUser)
  expect(find('s07-cycle', 'ask-assign', 'agent').steps).toEqual(['assign-action', 'client-page2', 'workouts-db', 'workout-page', 'sets-action', 'volume-lib', 'drop-fake'])
  expect(file('assign-action')).toMatchObject({ path: 'app/clients/[id]/actions.ts', before: null, by: 'agent' })
  expect(file('assign-action').after).toMatch(/^"use server";/)
  expect(file('assign-action').after).toContain('insert into workouts')
  const coach = file('client-page2')
  expect(coach).toMatchObject({ path: 'app/clients/[id]/page.tsx', before: find('s06-auth', 'client-page', 'file').after, by: 'agent' })
  expect(coach.after).toContain('new Date(workout.day).toLocaleDateString()')
  expect(coach.after).toContain('assignWorkout.bind(null, id)')
  for (const label of ['Название', 'Дата', 'Назначить']) expect(coach.after).toContain(label)
  const workouts = file('workouts-db')
  expect(workouts).toMatchObject({ path: 'app/workouts/page.tsx', by: 'agent' })
  expect(workouts.before).toContain('@/lib/workouts')
  expect(workouts.after).toContain('asUser(uid')
  expect(workouts.after).not.toContain('@/lib/workouts')
  expect(file('workout-page')).toMatchObject({ path: 'app/workouts/[id]/page.tsx', before: null, by: 'agent' })
  for (const part of ['Вес, кг', 'Повторы', 'Сохранить подход', 'volume(workout.sets)']) expect(file('workout-page').after).toContain(part)
  expect(file('sets-action')).toMatchObject({ path: 'app/workouts/[id]/actions.ts', before: null, by: 'agent' })
  expect(file('sets-action').after).toContain('parseWeight(')
  expect(file('sets-action').after).toContain('insert into sets')
  const volume = file('volume-lib')
  expect(volume).toMatchObject({ path: 'lib/volume.ts', before: null, by: 'agent' })
  expect(volume.after).toContain('weight * reps, 0)')
  // выдуманные данные уходят: lib/workouts.ts больше никто не импортирует
  expect(find('s07-cycle', 'drop-fake', 'run')).toMatchObject({ cmd: 'git rm -q lib/workouts.ts', code: 0, out: [], by: 'agent', files: [{ path: 'lib/workouts.ts', blob: null }] })
  // Анна добавляет всё в индекс и читает изменение: список файлов, затем дифф страницы тренера
  const stage = find('s07-cycle', 'stage', 'run')
  expect(stage).toMatchObject({ cmd: 'git add -A', code: 0, out: [] })
  expect(stage.by).toBeUndefined()
  const stat = find('s07-cycle', 'diff-stat', 'run')
  expect(stat).toMatchObject({ cmd: 'git diff --stat HEAD', code: 0 })
  const changed = stat.out.flatMap((line) => {
    const row = /^ (\S+)\s+\|/.exec(line)
    return row ? [row[1]] : []
  })
  expect(changed).toEqual(['app/clients/[id]/actions.ts', 'app/clients/[id]/page.tsx', 'app/workouts/[id]/actions.ts', 'app/workouts/[id]/page.tsx', 'app/workouts/page.tsx', 'lib/volume.ts', 'lib/workouts.ts'])
  const diff = find('s07-cycle', 'diff-assign', 'run')
  expect(diff).toMatchObject({ cmd: "git diff HEAD -- 'app/clients/[id]/page.tsx'", code: 0 })
  expect(diff.out[0]).toBe('diff --git a/app/clients/[id]/page.tsx b/app/clients/[id]/page.tsx')
  expect(diff.out).toContain('+              <p className="text-sm text-zinc-500">{new Date(workout.day).toLocaleDateString()}</p>')
  // вход двух ролей: тренер — на /clients, подопечная — на /workouts, у Анны её тренировки из базы и нет тренировок Олега
  expect(find('s07-cycle', 'login-marina', 'browser').urlAfter).toBe('http://localhost:3000/clients')
  const anna = find('s07-cycle', 'login-anna', 'browser')
  expect(anna.fields).toEqual([
    { label: 'Почта', value: 'anna@example.com' },
    { label: 'Пароль', value: 'demo-password' },
  ])
  expect(anna.urlAfter).toBe('http://localhost:3000/workouts')
  for (const title of ['Ноги', 'Спина и бицепс', 'Грудь и плечи', 'Грудь и спина', '2 ноября']) expect(anna.after).toContain(title)
  for (const title of ['Присед и тяга', 'Жим лёжа']) expect(anna.after).not.toContain(title)
  // «Грудь и спина» — шестая тренировка: в seed их пять
  expect(find('s07-cycle', 'log-set', 'browser').url).toBe('http://localhost:3000/workouts/6')
  expect(find('s07-cycle', 'log-set', 'browser').urlAfter).toBeUndefined()
  expect(find('s06-auth', 'seed-file', 'file').after.match(/^ {2}\(\d, '[^']+', '2026-\d\d-\d\d'\)/gm)).toHaveLength(5)
  // дата по-русски: formatDay в lib/dates.ts, на страницах тренера и подопечного
  expect(find('s07-cycle', 'ask-date', 'agent').steps).toEqual(['dates-lib', 'date-use-1', 'date-use-2'])
  expect(file('dates-lib')).toMatchObject({ path: 'lib/dates.ts', before: null, by: 'agent' })
  expect(file('dates-lib').after).toContain('toLocaleDateString("ru-RU", { day: "numeric", month: "long" })')
  expect(file('date-use-1')).toMatchObject({ path: 'app/clients/[id]/page.tsx', before: coach.after, by: 'agent' })
  expect(file('date-use-2')).toMatchObject({ path: 'app/workouts/page.tsx', before: workouts.after, by: 'agent' })
  for (const id of ['date-use-1', 'date-use-2']) {
    expect(file(id).after).toContain('formatDay(workout.day)')
    expect(file(id).after).not.toContain('toLocaleDateString')
  }
  // тест на объём — по требованию из запроса; поломку вносит человек, git restore возвращает файл из индекса
  expect(find('s07-cycle', 'ask-volume-test', 'agent').steps).toEqual(['volume-test', 'volume-run'])
  expect(file('volume-test')).toMatchObject({ path: 'lib/volume.test.ts', before: null, by: 'agent' })
  expect(file('volume-test').after).toContain('toBe(1500)')
  expect(file('volume-test').after).toContain('expect(volume([])).toBe(0)')
  expect(find('s07-cycle', 'volume-run', 'run')).toMatchObject({ cmd: 'npx vitest run lib/volume.test.ts', by: 'agent' })
  expect(find('s07-cycle', 'volume-run', 'run').out.join('\n')).toContain('2 passed')
  const broken = file('break')
  expect(broken).toMatchObject({ path: 'lib/volume.ts', before: volume.after })
  expect(broken.by).toBeUndefined()
  expect(broken.after).toContain('weight + reps, 0)')
  const red = find('s07-cycle', 'red', 'run')
  expect(red.cmd).toBe('npm test')
  expect(red.out.join('\n')).toContain('lib/volume.test.ts')
  expect(red.out.join('\n')).toContain('1 failed')
  expect(find('s07-cycle', 'unbreak', 'run')).toMatchObject({ cmd: 'git restore lib/volume.ts', code: 0, files: [{ path: 'lib/volume.ts', blob: volume.blob }] })
  expect(find('s07-cycle', 'green', 'run')).toMatchObject({ cmd: 'npm test' })
  expect(find('s07-cycle', 'pw', 'run')).toMatchObject({ cmd: 'npm install -D @playwright/test@1.56.1', code: 0 })
  // сквозной тест: Vitest не берёт e2e/, Playwright идёт по запущенному npm run dev, отчёты — в .gitignore до запуска
  expect(find('s07-cycle', 'ask-e2e', 'agent').steps).toEqual(['vitest-config', 'pw-config', 'e2e-file', 'e2e-ignore', 'e2e-run'])
  expect(file('vitest-config')).toMatchObject({ path: 'vitest.config.ts', before: null, by: 'agent' })
  expect(file('vitest-config').after).toContain('"e2e/**"')
  expect(file('pw-config')).toMatchObject({ path: 'playwright.config.ts', before: null, by: 'agent' })
  expect(file('pw-config').after).toContain('baseURL: "http://localhost:3000"')
  expect(file('pw-config').after).toContain('reuseExistingServer: true')
  expect(file('e2e-file')).toMatchObject({ path: 'e2e/cycle.spec.ts', before: null, by: 'agent' })
  expect(file('e2e-ignore')).toMatchObject({ path: '.gitignore', by: 'agent' })
  expect(file('e2e-ignore').after).toContain('/test-results/\n/playwright-report/\n')
  expect(find('s07-cycle', 'e2e-run', 'run')).toMatchObject({ cmd: 'npx playwright test', by: 'agent' })
  // коммит: новые файлы есть, lib/workouts.ts и отчётов Playwright нет
  const commit = find('s07-cycle', 'c-cycle', 'commit')
  expect(commit).toMatchObject({ message: 'Основной цикл: назначить тренировку, вписать подходы; тесты', branch: 'main' })
  const paths = commit.files.map((f) => f.path)
  for (const path of ['app/clients/[id]/actions.ts', 'app/workouts/[id]/page.tsx', 'lib/volume.ts', 'lib/volume.test.ts', 'lib/dates.ts', 'e2e/cycle.spec.ts', 'playwright.config.ts', 'vitest.config.ts']) {
    expect(paths).toContain(path)
  }
  expect(paths).not.toContain('lib/workouts.ts')
  expect(paths.filter((path) => /^(test-results|playwright-report)\//.test(path))).toEqual([])
  // браузер без ошибок: в выводе сервера нет ошибок Next, в консоли — ошибок страницы
  for (const id of ['login-marina', 'assign', 'assign-view', 'login-anna', 'log-set']) {
    const view = find('s07-cycle', id, 'browser')
    expect(view.server.join('\n'), id).not.toMatch(/Error|uncached data|Suspense/)
    expect(view.console.filter((m) => m.type === 'error'), id).toEqual([])
    expect(view.network, id).toEqual([])
  }
})

test('s08: стектрейс, деление пополам находит «Упростить», откат возвращает зелёные тесты', () => {
  // Марина назначает «Ноги» без подходов — страница падает: TypeError и стектрейс с app/clients/[id]/page.tsx в выводе сервера
  const crash = find('s08-debug', 'assign2', 'browser')
  expect(crash.url).toBe('http://localhost:3000/clients/1')
  expect(crash.fields).toEqual([
    { label: 'Название', value: 'Ноги' },
    { label: 'Дата', value: '2026-11-04' },
  ])
  const server = crash.server.join('\n')
  expect(server).toContain('TypeError')
  expect(server).toContain('page.tsx')
  // в запросе — строка ошибки и первая строка стектрейса дословно
  const at = crash.server.findIndex((line) => line.includes('TypeError'))
  const stack = crash.server[at + 1].trim()
  expect(stack).toMatch(/^at .*\(app\/clients\/\[id\]\/page\.tsx:\d+:\d+\)$/)
  const cause = find('s08-debug', 'ask-cause', 'agent')
  expect(cause.prompt).toContain(crash.server[at].trim())
  expect(cause.prompt).toContain(stack)
  expect(cause.prompt).toContain('Найди причину, пока ничего не исправляй')
  // после исправления в запросе: вторая «Ноги» на 4 ноября, объём 0
  const ok = find('s08-debug', 'crash-ok', 'browser').after
  expect(ok).toContain('Ноги')
  expect(ok.slice(-3)).toEqual(['Ноги', '4 ноября', 'Объём: 0 кг'])
  // четыре коммита без тестов — красный; git bisect run по тесту объёма называет «Упростить подсчёт объёма»
  const red = find('s08-debug', 'test-red', 'run')
  expect(red.code).not.toBe(0)
  expect(red.out.some((line) => line.startsWith('   × пустая тренировка — 0 '))).toBe(true)
  expect(red.out.join('\n')).toContain('TypeError: Reduce of empty array with no initial value')
  const bisect = find('s08-debug', 'bisect-run', 'run')
  expect(bisect.out.join('\n')).toContain('is the first bad commit')
  expect(bisect.out.join('\n')).toContain('Упростить подсчёт объёма')
  const simplify = find('s08-debug', 'c-simplify', 'commit')
  expect(bisect.out.find((line) => line.endsWith(' is the first bad commit'))).toMatch(new RegExp(`^${simplify.hash}[0-9a-f]{33} is`))
  // откат только «Упростить» — тесты снова зелёные, и после рефакторинга тоже
  expect(find('s08-debug', 'test-green', 'run').code).toBe(0)
  expect(find('s08-debug', 'refactor-test', 'run').code).toBe(0)
  // миграция с заметкой применена
  expect(find('s08-debug', 'note-apply', 'run').out.join('\n')).toContain('ALTER TABLE')
})

test('s08: шаги идут по таблице; причину правят в запросе; bisect между c-fix и c-hint; SetList и заметку пишет агент', () => {
  expect(sessions['s08-debug'].events.map((e) => e.id)).toEqual([
    ...['dev', 'ask-volumes', 'volumes-page', 'login-marina', 'assign2', 'ask-cause', 'cause-read', 'ask-fix-cause', 'cause-fix', 'crash-ok', 'c-fix'],
    ...['ask-round', 'round-fix', 'c-round', 'ask-simplify', 'simplify', 'c-simplify', 'ask-label', 'label', 'c-label', 'ask-hint', 'hint', 'c-hint'],
    ...['test-red', 'bisect-start', 'bisect-run', 'bisect-reset', 'revert-simplify', 'test-green'],
    ...['ask-refactor', 'setlist', 'use-setlist-1', 'use-setlist-2', 'refactor-test', 'diff-refactor', 'c-refactor'],
    ...['ask-mentor', 'mentor-read', 'prompts', 'ask-migration', 'note-sql', 'note-apply', 'note-form', 'note-action', 'c-mentor'],
  ])
  const file = (id: string) => find('s08-debug', id, 'file')
  const agent = (id: string) => find('s08-debug', id, 'agent')
  const commit = (id: string) => find('s08-debug', id, 'commit')
  const COACH = 'app/clients/[id]/page.tsx'
  const WORKOUT = 'app/workouts/[id]/page.tsx'
  // объём на карточке: подходы одним запросом через json_agg с filter — у тренировки без подходов он даёт null
  expect(agent('ask-volumes')).toMatchObject({ prompt: 'На странице подопечного у каждой тренировки — объём', steps: ['volumes-page'] })
  const volumes = file('volumes-page')
  expect(volumes).toMatchObject({ path: COACH, before: find('s07-cycle', 'date-use-1', 'file').after, by: 'agent' })
  expect(volumes.after).toContain('json_agg(s order by s.id) filter (where s.id is not null) as sets')
  expect(volumes.after).toContain('left join sets s on s.workout_id = w.id')
  expect(volumes.after).toContain('{workout.sets.map((set) => (')
  expect(volumes.after).toContain('Объём: {volume(workout.sets)} кг')
  // до падения карточка с подходами и объёмами тренировок seed
  expect(find('s08-debug', 'assign2', 'browser').before).toContain('Объём: 1500 кг')
  expect(find('s08-debug', 'assign2', 'browser').server.join('\n')).toContain('ƒ assignWorkout("1", {})')
  // причина: агент только читает страницу; исправление — одна строка запроса, разметка без проверок на null
  expect(agent('ask-cause').steps).toEqual(['cause-read'])
  expect(find('s08-debug', 'cause-read', 'read')).toMatchObject({ path: COACH, text: volumes.after, by: 'agent' })
  expect(agent('ask-cause').reply).toContain('null')
  expect(agent('ask-fix-cause')).toMatchObject({ prompt: 'Исправь причину в запросе, а не проверкой в разметке', steps: ['cause-fix'] })
  const fix = file('cause-fix')
  expect(fix).toMatchObject({ path: COACH, before: volumes.after, by: 'agent' })
  expect(fix.after).toContain("coalesce(json_agg(s order by s.id) filter (where s.id is not null), '[]') as sets")
  expect(fix.diff.filter((line) => /^[-+](?![-+])/.test(line))).toHaveLength(2)
  expect(fix.after).not.toMatch(/sets \?\?|sets\?\./)
  expect(find('s08-debug', 'crash-ok', 'browser').server.join('\n')).not.toMatch(/Error/)
  expect(commit('c-fix')).toMatchObject({ message: 'Объём тренировок у тренера; тренировка без подходов не роняет страницу', branch: 'main' })
  // четыре маленьких коммита: только «Упростить» трогает начальное значение reduce
  expect(file('round-fix')).toMatchObject({ path: 'lib/volume.ts', before: find('s07-cycle', 'volume-lib', 'file').after, by: 'agent' })
  expect(file('round-fix').after).toContain('Math.round(sets.reduce((sum, { weight, reps }) => sum + weight * reps, 0))')
  expect(agent('ask-simplify').prompt).toBe('Упрости lib/volume.ts')
  expect(file('simplify')).toMatchObject({ path: 'lib/volume.ts', before: file('round-fix').after, by: 'agent' })
  expect(file('simplify').after).toContain('.reduce((sum, value) => sum + value))')
  expect(file('label')).toMatchObject({ path: COACH, before: fix.after, by: 'agent' })
  expect(file('label').after).toContain('Объём, кг: {volume(workout.sets)}')
  expect(file('hint')).toMatchObject({ path: WORKOUT, before: find('s07-cycle', 'workout-page', 'file').after, by: 'agent' })
  expect(file('hint').after).toContain('Подходов пока нет')
  // цепочка: c-fix ← c-round ← c-simplify ← c-label ← c-hint, каждый — один файл; HEAD~4 у bisect — c-fix
  const chain = ['c-fix', 'c-round', 'c-simplify', 'c-label', 'c-hint'].map(commit)
  expect(chain.map((c) => c.message)).toEqual([
    'Объём тренировок у тренера; тренировка без подходов не роняет страницу',
    'Объём — целым числом',
    'Упростить подсчёт объёма',
    'Подпись «Объём, кг»',
    'Подсказка «Подходов пока нет»',
  ])
  for (let i = 1; i < chain.length; i++) {
    expect(chain[i].parents, chain[i].id).toEqual([chain[i - 1].hash])
    expect(chain[i].out.join('\n'), chain[i].id).toContain(' 1 file changed')
  }
  expect(chain[0].parents).toEqual([find('s07-cycle', 'c-cycle', 'commit').hash])
  for (const id of ['test-red', 'bisect-start', 'bisect-run', 'bisect-reset', 'revert-simplify', 'test-green', 'diff-refactor']) {
    expect(find('s08-debug', id, 'run').by, id).toBeUndefined()
  }
  expect(find('s08-debug', 'bisect-start', 'run')).toMatchObject({ cmd: 'git bisect start HEAD HEAD~4', code: 0 })
  expect(find('s08-debug', 'bisect-run', 'run')).toMatchObject({ cmd: 'git bisect run npx vitest run lib/volume.test.ts', code: 0 })
  expect(find('s08-debug', 'bisect-run', 'run').out.filter((line) => line.startsWith("running 'npx' 'vitest'")).length).toBeGreaterThanOrEqual(2)
  // dev-сервер во время bisect файлов проекта не пишет: команды меняют только файлы этих коммитов
  for (const id of ['bisect-start', 'bisect-run', 'bisect-reset']) {
    for (const f of find('s08-debug', id, 'run').files ?? []) expect(['lib/volume.ts', COACH, WORKOUT], id).toContain(f.path)
  }
  expect(find('s08-debug', 'bisect-reset', 'run')).toMatchObject({ cmd: 'git bisect reset', code: 0 })
  expect(find('s08-debug', 'bisect-reset', 'run').out).toContain("Switched to branch 'main'")
  const revert = find('s08-debug', 'revert-simplify', 'run')
  expect(revert).toMatchObject({ cmd: 'git revert --no-edit HEAD~2', code: 0, files: [{ path: 'lib/volume.ts', blob: file('round-fix').blob }] })
  expect(revert.out[0]).toMatch(/^\[main [0-9a-f]{7}\] Revert "Упростить подсчёт объёма"$/)
  expect(find('s08-debug', 'test-green', 'run').out.join('\n')).toContain('Tests  10 passed (10)')
  // рефакторинг: общий вывод подходов в components/SetList.tsx, на страницах — только SetList
  expect(agent('ask-refactor').steps).toEqual(['setlist', 'use-setlist-1', 'use-setlist-2', 'refactor-test'])
  expect(file('setlist')).toMatchObject({ path: 'components/SetList.tsx', before: null, by: 'agent' })
  expect(file('setlist').after).toContain('{set.weight} кг × {set.reps}')
  expect(file('use-setlist-1')).toMatchObject({ path: COACH, before: file('label').after, by: 'agent' })
  expect(file('use-setlist-2')).toMatchObject({ path: WORKOUT, before: file('hint').after, by: 'agent' })
  for (const id of ['use-setlist-1', 'use-setlist-2']) {
    expect(file(id).after, id).toContain('<SetList sets={workout.sets}')
    expect(file(id).after, id).not.toContain('{set.weight} кг × {set.reps}')
  }
  expect(find('s08-debug', 'refactor-test', 'run')).toMatchObject({ cmd: 'npm test', by: 'agent' })
  // новый SetList.tsx ещё не в git: git diff --stat видит только две страницы
  const stat = find('s08-debug', 'diff-refactor', 'run')
  expect(stat).toMatchObject({ cmd: 'git diff --stat', code: 0 })
  expect(stat.out.flatMap((line) => /^ (\S+)\s+\|/.exec(line)?.[1] ?? [])).toEqual([COACH, WORKOUT])
  expect(commit('c-refactor').files.map((f) => f.path)).toContain('components/SetList.tsx')
  // наставник: только чтение политики, объяснение и три вопроса в конце
  expect(agent('ask-mentor').steps).toEqual(['mentor-read'])
  expect(find('s08-debug', 'mentor-read', 'read')).toMatchObject({ path: 'supabase/migrations/0002_rls.sql', text: find('s06-auth', 'rls-sql', 'file').after, by: 'agent' })
  const mentor = agent('ask-mentor').reply
  expect(mentor.match(/\?/g)).toHaveLength(3)
  expect(mentor).toMatch(/1\. [^?]+\? 2\. [^?]+\? 3\. [^?]+\?$/)
  // журнал запросов пишет человек: четыре записи с датами и строка разбора недели
  const prompts = file('prompts')
  expect(prompts).toMatchObject({ path: 'docs/prompts.md', before: null })
  expect(prompts.by).toBeUndefined()
  expect(prompts.after.match(/^## \d\d\.\d\d$/gm)).toEqual(['## 28.10', '## 29.10', '## 30.10', '## 01.11'])
  for (const field of ['- Задача: ', '- Запрос: ', '- Сработало: ', '- Не сработало: ']) expect(prompts.after.split(field), field).toHaveLength(5)
  expect(prompts.after).toMatch(/^Разбор недели/m)
  expect(find('s02-sets', 'ask-fix', 'agent').prompt).toContain('Failed to load resource: the server responded with a status of 400 (Bad Request)')
  expect(prompts.after).toContain('«Failed to load resource: the server responded with a status of 400 (Bad Request)»')
  expect(prompts.after).toContain('Найди причину, пока ничего не исправляй')
  // миграция с подтверждения: файл, psql -f от агента (в кадре — с вопросом [y / n]), поле «Заметка» и действие
  expect(agent('ask-migration').steps).toEqual(['note-sql', 'note-apply', 'note-form', 'note-action'])
  expect(file('note-sql')).toMatchObject({ path: 'supabase/migrations/0003_set_note.sql', before: null, by: 'agent' })
  expect(file('note-sql').after).toContain('alter table sets add column note text check (char_length(note) <= 200);')
  expect(find('s08-debug', 'note-apply', 'run')).toMatchObject({ cmd: 'psql -f supabase/migrations/0003_set_note.sql', code: 0, out: ['ALTER TABLE'], by: 'agent' })
  expect(file('note-form')).toMatchObject({ path: WORKOUT, before: file('use-setlist-2').after, by: 'agent' })
  expect(file('note-form').after).toContain('<label htmlFor="note">Заметка</label>')
  expect(file('note-action')).toMatchObject({ path: 'app/workouts/[id]/actions.ts', before: find('s07-cycle', 'sets-action', 'file').after, by: 'agent' })
  expect(file('note-action').after).toContain('insert into sets (workout_id, weight, reps, note)')
  const last = commit('c-mentor')
  expect(last).toMatchObject({ message: 'Журнал запросов и заметка к подходу', branch: 'main', parents: [commit('c-refactor').hash] })
  for (const path of ['docs/prompts.md', 'supabase/migrations/0003_set_note.sql', 'components/SetList.tsx']) expect(last.files.map((f) => f.path)).toContain(path)
  // браузер: вход Марины, падение только в assign2
  expect(find('s08-debug', 'login-marina', 'browser').urlAfter).toBe('http://localhost:3000/clients')
  for (const id of ['login-marina', 'crash-ok']) expect(find('s08-debug', id, 'browser').console.filter((m) => m.type === 'error'), id).toEqual([])
})

// Сколько строк «[sql] …» в выводе сервера браузерного шага
function sqlLines(session: string, id: string): number {
  return find(session, id, 'browser').server.filter((line) => line.includes('[sql]')).length
}

test('s09: инъекция отдаёт чужих, после исправления — нет; пятый неудачный вход последний; секрет не проходит в коммит; N+1 → 1', () => {
  // инъекция «\' or 1=1 --» в наивном поиске отдаёт всех подопечных, включая чужую Свету
  expect(find('s09-audit', 'inject', 'run').out.join('\n')).toContain('Света')
  // после правки (параметр + asUser вошедшего) та же команда от Марины — пусто, без входа — 401
  expect(find('s09-audit', 'inject2', 'run').out).toEqual(['[]'])
  expect(find('s09-audit', 'anon', 'run').out.join('\n')).toContain('Нужно войти')
  // пять неудачных входов — 401, шестой — 429
  expect(find('s09-audit', 'limit-curl', 'run').out).toEqual(['401', '401', '401', '401', '401', '429'])
  // советованного пакета нет в реестре
  const pkg = find('s09-audit', 'pkg-check', 'run')
  expect(pkg.code).not.toBe(0)
  expect(pkg.out.join('\n')).toContain('404')
  // сканер секретов не пустил коммит с ключом в lib/payments.ts
  const blocked = find('s09-audit', 'commit-blocked', 'run')
  expect(blocked.code).not.toBe(0)
  expect(blocked.out.join('\n')).toContain('Похоже на секрет')
  expect(blocked.out.join('\n')).toContain('lib/payments.ts')
  // список подопечных: отдельный запрос на каждого (1 + 12) — одним запросом стало 1
  expect(sqlLines('s09-audit', 'clients-n1')).toBeGreaterThanOrEqual(11)
  expect(sqlLines('s09-audit', 'clients-1')).toBe(1)
  // проверка перед слиянием зелёная
  expect(find('s09-audit', 'check-run', 'run').code).toBe(0)
})

test('s09: шаги по таблице; инъекцию и ограничитель пишет агент; vitest-warn и хук — человек; коммиты на main', () => {
  expect(sessions['s09-audit'].events.map((e) => e.id)).toEqual([
    ...['vitest-warn', 'dev', 'ask-chart', 'chart-comp', 'chart-use', 'login-marina', 'chart-view', 'c-chart'],
    ...['ask-search', 'search-route', 'login-curl', 'search-ok', 'inject', 'ask-inject-fix', 'search-fix', 'inject2', 'anon', 'c-search'],
    ...['ask-limit', 'limit-lib', 'limit-use', 'limit-curl', 'c-limit', 'ask-pkg', 'pkg-read', 'pkg-check'],
    ...['hook-file', 'hook-exec', 'hook-on', 'ask-pay', 'pay-lib', 'commit-blocked', 'ask-pay-fix', 'pay-env', 'pay-lib-fix', 'c-pay'],
    ...['seed-load-file', 'seed-load', 'rls-fix', 'ask-last', 'sql-log', 'last-n1', 'clients-n1', 'ask-n1-fix', 'last-join', 'clients-1', 'c-n1'],
    ...['check-script', 'check-run', 'c-check'],
  ])
  const file = (id: string) => find('s09-audit', id, 'file')
  const agent = (id: string) => find('s09-audit', id, 'agent')
  const run = (id: string) => find('s09-audit', id, 'run')
  const commit = (id: string) => find('s09-audit', id, 'commit')

  // первый шаг убирает предупреждение Vite из s07: переименование vitest.config.ts → .mts, тип пакета не меняем
  const warn = run('vitest-warn')
  expect(warn.cmd).toBe('git mv vitest.config.ts vitest.config.mts')
  expect(warn.by).toBeUndefined()
  expect(warn.files).toEqual([
    { path: 'vitest.config.mts', blob: expect.any(String) },
    { path: 'vitest.config.ts', blob: null },
  ])
  // и в этой сессии запуск npm run check — без 3-строчного предупреждения Vite
  expect(run('check-run').out.some((line) => line.includes('configLoader') || line.includes('unsupported by'))).toBe(false)

  // график прогресса пишет агент: компонент и правка карточки
  expect(agent('ask-chart').steps).toEqual(['chart-comp', 'chart-use'])
  expect(file('chart-comp')).toMatchObject({ path: 'components/ProgressChart.tsx', before: null, by: 'agent' })
  expect(file('chart-comp').after).toContain('<svg')
  expect(file('chart-comp').after).toContain('Прогресс: объём по тренировкам')
  expect(file('chart-use')).toMatchObject({ path: 'app/clients/[id]/page.tsx', by: 'agent' })
  const chartView = find('s09-audit', 'chart-view', 'browser')
  expect(chartView.url).toBe('http://localhost:3000/clients/1')
  expect(chartView.after).toContain('Прогресс: объём по тренировкам')
  expect(chartView.after).toContain('19 октября')

  // наивный поиск пишет агент (общий пул, склейка), правка — параметр и asUser
  expect(agent('ask-search').steps).toEqual(['search-route'])
  const naive = file('search-route')
  expect(naive).toMatchObject({ path: 'app/api/clients/search/route.ts', before: null, by: 'agent' })
  expect(naive.after).toContain("ilike '%${q}%'")
  expect(naive.after).toContain('pool.query')
  expect(find('s09-audit', 'search-ok', 'run').out.join('\n')).toContain('Анна')
  const fix = file('search-fix')
  expect(fix).toMatchObject({ path: 'app/api/clients/search/route.ts', before: naive.after, by: 'agent' })
  expect(fix.after).toContain("ilike '%' || $1 || '%'")
  expect(fix.after).toContain('asUser(uid')
  expect(fix.after).toContain('Нужно войти')
  // в запросе на исправление — команда и ответ шага inject дословно
  const injected = run('inject')
  expect(injected.out).toHaveLength(1)
  expect(agent('ask-inject-fix').prompt).toContain(injected.cmd)
  expect(agent('ask-inject-fix').prompt).toContain(injected.out[0])
  expect(commit('c-search').message).toBe('Поиск подопечных: параметры и права вошедшего')

  // ограничитель входа пишет агент: библиотека в памяти и правка маршрута
  expect(agent('ask-limit').steps).toEqual(['limit-lib', 'limit-use'])
  expect(file('limit-lib')).toMatchObject({ path: 'lib/rate-limit.ts', before: null, by: 'agent' })
  expect(file('limit-lib').after).toMatch(/в памяти/i)
  expect(file('limit-use')).toMatchObject({ path: 'app/api/login/route.ts', by: 'agent' })
  expect(file('limit-use').after).toContain('429')

  // агент советует несуществующий пакет; человек проверяет npm view
  expect(agent('ask-pkg').steps).toEqual(['pkg-read'])
  expect(find('s09-audit', 'pkg-read', 'read')).toMatchObject({ path: 'package.json', by: 'agent' })
  expect(run('pkg-check').cmd).toMatch(/^npm view /)
  expect(run('pkg-check').by).toBeUndefined()

  // сканер секретов — человек пишет хук, делает исполняемым и включает
  expect(file('hook-file')).toMatchObject({ path: '.githooks/pre-commit', before: null })
  expect(file('hook-file').by).toBeUndefined()
  expect(file('hook-file').after).toContain('Похоже на секрет')
  expect(run('hook-exec').cmd).toBe('chmod +x .githooks/pre-commit')
  expect(run('hook-on').cmd).toBe('git config core.hooksPath .githooks')
  // заготовку оплаты с секретом пишет агент; после блокировки секрет уходит в .env.local, в коде — process.env
  expect(agent('ask-pay').steps).toEqual(['pay-lib'])
  expect(file('pay-lib').after).toContain('demo-secret-not-real')
  expect(run('commit-blocked').cmd).toBe("git add -A && git commit -m 'Оплата подписки'")
  expect(agent('ask-pay-fix').steps).toEqual(['pay-env', 'pay-lib-fix'])
  expect(file('pay-env')).toMatchObject({ path: '.env.local' })
  expect(file('pay-env').after).toContain('PAY_SECRET=')
  expect(file('pay-lib-fix').after).toContain('process.env.PAY_SECRET')
  expect(file('pay-lib-fix').after).not.toContain('"demo-secret-not-real-payments-0001"')

  // данные для замера пишет человек; жёсткий тест RLS ослаблен из-за них
  expect(file('seed-load-file')).toMatchObject({ path: 'supabase/seed-load.sql', before: null })
  expect(file('seed-load-file').by).toBeUndefined()
  expect(run('seed-load').cmd).toBe('psql -f supabase/seed-load.sql')
  expect(file('rls-fix')).toMatchObject({ path: 'test/rls.test.ts' })
  expect(file('rls-fix').after).toContain('not.toContain("Света")')

  // N+1 правит агент: журнал запросов и дата последней тренировки, затем один запрос
  expect(agent('ask-last').steps).toEqual(['sql-log', 'last-n1'])
  expect(file('sql-log')).toMatchObject({ path: 'lib/db.ts', by: 'agent' })
  expect(file('sql-log').after).toContain('[sql] ')
  // журнал запросов — только в режиме разработки: под vitest (test) и в сборке (production) он молчит
  expect(file('sql-log').after).toContain('if (process.env.NODE_ENV === "development") {')
  expect(run('check-run').out.filter((line) => line.includes('[sql]'))).toEqual([])
  expect(file('last-n1')).toMatchObject({ path: 'app/clients/page.tsx', by: 'agent' })
  expect(agent('ask-n1-fix').prompt).toContain('13')
  expect(agent('ask-n1-fix').steps).toEqual(['last-join'])
  expect(file('last-join').after).toContain('left join workouts')

  // проверка перед слиянием: npm pkg set и npm run check
  expect(run('check-script').cmd).toContain('npm pkg set scripts.check=')
  expect(run('check-run').cmd).toBe('npm run check')

  // шесть коммитов цепочкой на main, начиная от s08
  const chain = ['c-chart', 'c-search', 'c-limit', 'c-pay', 'c-n1', 'c-check'].map(commit)
  for (const c of chain) expect(c.branch, c.id).toBe('main')
  for (let i = 1; i < chain.length; i++) expect(chain[i].parents, chain[i].id).toEqual([chain[i - 1].hash])
  expect(chain[0].parents).toEqual([find('s08-debug', 'c-mentor', 'commit').hash])
  // vitest.config.ts переименован в .mts в дереве последнего коммита
  const tree = commit('c-check').files.map((f) => f.path)
  expect(tree).toContain('vitest.config.mts')
  expect(tree).not.toContain('vitest.config.ts')
  expect(tree).toContain('.githooks/pre-commit')
  expect(tree).toContain('supabase/seed-load.sql')
})

test('s10: «Ольга» не проходит, потом проходит; заметка о здоровье уходит из журнала; метка ИИ в коммите', () => {
  // первая версия проверки «как у большинства» (только латиница) не пускает «Ольгу»: ошибка под формой, в списке её нет
  const refused = find('s10-care', 'add-olga', 'browser')
  expect(refused.after.join('\n')).toContain('Имя может содержать только буквы')
  expect(refused.after).not.toContain('Ольга')
  // после исправления проверки (и теста на имена) «Ольга» и «Анна-Мария» добавлены — стоят в списке подопечных
  expect(find('s10-care', 'names-run', 'run').code).toBe(0)
  expect(find('s10-care', 'add-olga2', 'browser').after).toContain('Ольга')
  expect(find('s10-care', 'add-anna-maria', 'browser').after).toContain('Анна-Мария')
  // журнал сервера: сначала в нём имя подопечного и заметка о колене, после правки — нет ни имени, ни заметки
  const careless = find('s10-care', 'log-set2', 'browser').server.join('\n')
  expect(careless).toContain('болит колено')
  expect(careless).toContain('Анна')
  const careful = find('s10-care', 'log-set3', 'browser').server.join('\n')
  expect(careful).not.toContain('болит колено')
  expect(careful).not.toContain('Анна')
  // лицензии зависимостей: среди них MIT
  expect(find('s10-care', 'licenses', 'run').out.join('\n')).toContain('MIT')
  // метка ИИ в сообщении коммита видна в git log
  expect(find('s10-care', 'show-label', 'run').out.join('\n')).toContain('Co-Authored-By: Claude')
})

test('s10: шаги по таблице; форму, проверку имён и журнал пишет агент; коммит с меткой ИИ — продолжение s09 на main', () => {
  expect(sessions['s10-care'].events.map((e) => e.id)).toEqual([
    ...['dev', 'login-marina', 'ask-add-client', 'name-lib', 'add-action', 'add-form', 'add-olga'],
    ...['ask-names', 'names-test', 'names-fix', 'names-run', 'add-olga2', 'add-anna-maria', 'login-anna'],
    ...['ask-log', 'log-full', 'log-set2', 'ask-log-fix', 'log-min', 'log-set3', 'licenses', 'c-care', 'show-label'],
  ])
  const file = (id: string) => find('s10-care', id, 'file')
  const agent = (id: string) => find('s10-care', id, 'agent')
  const run = (id: string) => find('s10-care', id, 'run')
  const browser = (id: string) => find('s10-care', id, 'browser')

  // две сессии подряд входят: Марина — на /clients, Анна — на /workouts
  expect(browser('login-marina').urlAfter).toBe('http://localhost:3000/clients')
  expect(browser('login-anna').urlAfter).toBe('http://localhost:3000/workouts')

  // добавление подопечного пишет агент; первая проверка имени — «как у большинства», только латиница
  expect(agent('ask-add-client').steps).toEqual(['name-lib', 'add-action', 'add-form'])
  expect(agent('ask-add-client').prompt).toBe('Тренер добавляет подопечного: на /clients поле «Имя» и кнопка «Добавить», с проверкой имени')
  expect(file('name-lib')).toMatchObject({ path: 'lib/names.ts', before: null, by: 'agent' })
  expect(file('name-lib').after).toContain('/^[A-Za-z ]+$/')
  expect(file('name-lib').after).toContain('Имя может содержать только буквы')
  // подопечный записывается от имени тренера (RLS), имя проверяет lib/names.ts
  expect(file('add-action')).toMatchObject({ path: 'app/clients/actions.ts', before: null, by: 'agent' })
  expect(file('add-action').after).toContain('asUser(uid')
  expect(file('add-action').after).toContain('insert into clients')
  expect(file('add-action').after).toContain('checkName(name)')
  expect(file('add-form')).toMatchObject({ path: 'app/clients/page.tsx', by: 'agent' })
  expect(file('add-form').after).toContain('<label htmlFor="name">Имя</label>')
  expect(file('add-form').after).toContain('Добавить')
  // «Ольга» в браузере: поле заполнено, под формой ошибка, адрес — с ошибкой
  expect(browser('add-olga').fields).toEqual([{ label: 'Имя', value: 'Ольга' }])
  expect(browser('add-olga').buttons).toContain('Добавить')
  expect(browser('add-olga').urlAfter).toContain('/clients?error=')

  // исправление: сначала тест, потом проверка, потом запуск; запрос — дословно из задачи
  expect(agent('ask-names').steps).toEqual(['names-test', 'names-fix', 'names-run'])
  expect(agent('ask-names').prompt).toBe(
    'Имя «Ольга» не проходит. Имена бывают на любом языке, с дефисом и апострофом: «Анна-Мария», «Д\'Артаньян». Сначала тест на эти случаи',
  )
  const test10 = file('names-test')
  expect(test10).toMatchObject({ path: 'lib/names.test.ts', before: null, by: 'agent' })
  for (const name of ['Ольга', 'Анна-Мария', "Д'Артаньян"]) expect(test10.after, name).toContain(`checkName("${name}")`)
  const fix = file('names-fix')
  expect(fix).toMatchObject({ path: 'lib/names.ts', before: file('name-lib').after, by: 'agent' })
  expect(fix.after).toContain('\\p{L}')
  expect(fix.after).not.toContain('A-Za-z')
  expect(run('names-run')).toMatchObject({ cmd: 'npx vitest run lib/names.test.ts', by: 'agent' })
  // Анна-Мария: дефис проходит; новые подопечные добавлены в тот же список
  expect(browser('add-anna-maria').fields).toEqual([{ label: 'Имя', value: 'Анна-Мария' }])
  expect(browser('add-anna-maria').after).toContain('Ольга')

  // журнал: сначала агент печатает подопечного и заметку целиком, потом — только id подхода и время
  expect(agent('ask-log').prompt).toBe('Пиши в журнал сервера сохранение подхода, чтобы разбирать ошибки')
  expect(agent('ask-log').steps).toEqual(['log-full'])
  const full = file('log-full')
  expect(full).toMatchObject({ path: 'app/workouts/[id]/actions.ts', by: 'agent' })
  expect(full.after).toContain('console.log("Подход сохранён"')
  expect(full.after).toMatch(/client: saved\.client/)
  expect(full.after).toMatch(/\bnote,/)
  // тренировка 3 — из seed, она Анны
  expect(browser('log-set2').url).toBe('http://localhost:3000/workouts/3')
  expect(browser('log-set2').fields).toEqual([
    { label: 'Вес, кг', value: '40' },
    { label: 'Повторы', value: '10' },
    { label: 'Заметка', value: 'болит колено' },
  ])
  expect(agent('ask-log-fix').prompt).toBe('В журнале — данные о здоровье. Только id подхода и время, без имени и заметки')
  expect(agent('ask-log-fix').steps).toEqual(['log-min'])
  const min = file('log-min')
  expect(min).toMatchObject({ path: 'app/workouts/[id]/actions.ts', before: full.after, by: 'agent' })
  expect(min.after).toContain('console.log("Подход сохранён", { setId, time:')
  expect(min.after).not.toContain('client')
  expect(min.after).not.toMatch(/console\.log\([^)]*note/)
  // тот же ввод в log-set3
  expect(browser('log-set3').url).toBe(browser('log-set2').url)
  expect(browser('log-set3').fields).toEqual(browser('log-set2').fields)

  // лицензии и метка ИИ: человек запускает license-checker, коммит с метками в двух абзацах
  expect(run('licenses').cmd).toBe('npx --yes license-checker --summary')
  expect(run('licenses').code).toBe(0)
  expect(run('licenses').by).toBeUndefined()
  const care = find('s10-care', 'c-care', 'commit')
  expect(care.message).toBe('Имена на любом языке; журнал без данных о здоровье\n\nCo-Authored-By: Claude <noreply@anthropic.com>')
  expect(care.branch).toBe('main')
  expect(care.parents).toEqual([find('s09-audit', 'c-check', 'commit').hash])
  const tree = care.files.map((f) => f.path)
  for (const path of ['lib/names.ts', 'lib/names.test.ts', 'app/clients/actions.ts']) expect(tree).toContain(path)
  expect(run('show-label').cmd).toBe('git log -1')
  expect(run('show-label').out.join('\n')).toContain(care.hash)
})

test('s11: рабочая сборка отвечает, манифест на месте', () => {
  // сборка видит манифест и маршрут иконки; вход за Марину в рабочей сборке (npm start) приводит на /clients
  const built = find('s11-ship', 'build', 'run')
  expect(built.code).toBe(0)
  expect(built.out.join('\n')).toContain('/manifest.webmanifest')
  expect(find('s11-ship', 'prod-login', 'browser').urlAfter?.endsWith('/clients')).toBe(true)
  // манифест по прямому адресу: имя «Тренер» и режим standalone
  const manifest = find('s11-ship', 'prod-manifest', 'browser').after.join('\n')
  expect(manifest).toContain('Тренер')
  expect(manifest).toContain('standalone')
})

test('s11: шаги по таблице; манифест и иконку пишет агент, таблицу паритета и план — человек; три коммита на main — продолжение s10', () => {
  expect(sessions['s11-ship'].events.map((e) => e.id)).toEqual([
    ...['ask-pwa', 'manifest-file', 'icon-file', 'build', 'start', 'prod-login', 'prod-manifest', 'c-pwa'],
    ...['parity', 'c-parity', 'plan-file', 'c-plan', 'pass-map', 'pass-log'],
  ])
  const file = (id: string) => find('s11-ship', id, 'file')
  const run = (id: string) => find('s11-ship', id, 'run')
  const commit = (id: string) => find('s11-ship', id, 'commit')

  // PWA: просьба, манифест (имя, standalone, start_url) и иконка из JSX через ImageResponse — оба файла пишет агент
  const ask = find('s11-ship', 'ask-pwa', 'agent')
  expect(ask.prompt).toBe('Сделай приложение устанавливаемым на телефон: манифест и иконка')
  expect(ask.steps).toEqual(['manifest-file', 'icon-file'])
  expect(file('manifest-file')).toMatchObject({ path: 'app/manifest.ts', before: null, by: 'agent' })
  expect(file('manifest-file').after).toContain('name: "Тренер"')
  expect(file('manifest-file').after).toContain('display: "standalone"')
  expect(file('manifest-file').after).toContain('start_url: "/login"')
  expect(file('icon-file')).toMatchObject({ path: 'app/icon.tsx', before: null, by: 'agent' })
  expect(file('icon-file').after).toContain('ImageResponse')

  // рабочая сборка: npm run build печатает маршруты (манифест и иконка в списке), npm start держится до «Ready»
  expect(run('build').cmd).toBe('npm run build')
  expect(run('build').out.join('\n')).toMatch(/\/icon\b/)
  expect(run('start')).toMatchObject({ cmd: 'npm start', code: null })
  expect(run('start').out.join('\n')).toContain('Ready')
  expect(run('start').by).toBeUndefined()
  // обе браузерные проверки идут по рабочей сборке: вход без перенаправления с /login, манифест — по прямому адресу
  const login = find('s11-ship', 'prod-login', 'browser')
  expect(login.url).toBe('http://localhost:3000/login')
  expect(login.fields).toEqual([
    { label: 'Почта', value: 'marina@example.com' },
    { label: 'Пароль', value: 'demo-password' },
  ])
  expect(login.urlAfter).toBe('http://localhost:3000/clients')
  const manifestPage = find('s11-ship', 'prod-manifest', 'browser')
  expect(manifestPage.url).toBe('http://localhost:3000/manifest.webmanifest')
  expect(manifestPage.urlAfter).toBeUndefined()
  expect(manifestPage.network).toEqual([])

  // таблица паритета (шаг 5 чистой комнаты): сценарии × три эталона × «наше»; ячейки — только из своих слов
  const parity = file('parity')
  expect(parity).toMatchObject({ path: 'docs/parity.md', before: null })
  expect(parity.by).toBeUndefined()
  const rows = parity.after
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
  expect(rows[0]).toEqual(['Сценарий', 'Эталон А', 'Эталон Б', 'Эталон В', 'Наше'])
  const scenarios = rows.slice(2)
  expect(scenarios.length).toBeGreaterThanOrEqual(10)
  for (const [name, a, b, v, ours] of scenarios) {
    for (const cell of [a, b, v]) expect(['есть', 'нет'], name).toContain(cell)
    expect(['есть', 'нет', 'позже'], name).toContain(ours)
  }
  for (const word of ['есть', 'нет', 'позже']) expect(scenarios.map((row) => row[4]), word).toContain(word)
  // отличие из спецификации: вес и повторы тренер видит только у нас
  expect(scenarios.find((row) => row[0].startsWith('Тренер видит вес и повторы'))?.slice(1)).toEqual(['нет', 'нет', 'нет', 'есть'])
  // эталоны без названий настоящих продуктов
  expect(parity.after).not.toMatch(/Strong|Hevy|Trainerize|TrueCoach|MyFitnessPal|World Class/i)

  // план недель 2–3: слова Марины с пробы и приоритеты по строкам таблицы паритета
  const plan = file('plan-file')
  expect(plan).toMatchObject({ path: 'docs/plan-weeks-2-3.md', before: null })
  expect(plan.by).toBeUndefined()
  expect(plan.after).toContain('Марина')
  expect(plan.after).toContain('docs/parity.md')
  for (const heading of ['## Что сказала Марина', '## Приоритеты', '## Неделя 2', '## Неделя 3']) expect(plan.after, heading).toContain(heading)

  // три коммита подряд на main, первый — от последнего коммита s10; в первый ушли манифест и иконка
  const chain = ['c-pwa', 'c-parity', 'c-plan'].map(commit)
  expect(chain.map((c) => c.message)).toEqual([
    'Приложение ставится на телефон: манифест и иконка',
    'Таблица паритета с эталонами',
    'План недель 2–3 после пробы с тренером',
  ])
  for (const c of chain) expect(c.branch, c.id).toBe('main')
  for (let i = 1; i < chain.length; i++) expect(chain[i].parents, chain[i].id).toEqual([chain[i - 1].hash])
  expect(chain[0].parents).toEqual([find('s10-care', 'c-care', 'commit').hash])
  const tree = (c: (typeof chain)[number]) => c.files.map((f) => f.path)
  expect(tree(chain[0])).toEqual(expect.arrayContaining(['app/manifest.ts', 'app/icon.tsx']))
  expect(tree(chain[0])).not.toContain('docs/parity.md')
  expect(tree(chain[1])).toContain('docs/parity.md')
  expect(tree(chain[2])).toContain('docs/plan-weeks-2-3.md')
  // сканер секретов ничего не нашёл: коммиты прошли

  // карта проекта и последние три коммита — после последнего коммита, ничего не меняют
  expect(run('pass-map').cmd).toBe('git ls-files app lib components supabase')
  expect(run('pass-map').out).toEqual(expect.arrayContaining(['app/manifest.ts', 'app/icon.tsx', 'lib/db.ts', 'components/SetList.tsx']))
  expect(run('pass-map').files).toBeUndefined()
  expect(run('pass-log').cmd).toBe('git log --oneline --stat -3')
  expect(run('pass-log').files).toBeUndefined()
  const log = run('pass-log').out.join('\n')
  for (const c of chain) expect(log).toContain(`${c.hash} ${c.message}`)
})

test('s12: агент подогнал тест, приёмка это ловит, после исправления — зелёный по задаче', () => {
  const run = (id: string) => find('s12-agent', id, 'run')
  // по задаче рекорд — 62,5 кг; код агента считает по объёму подхода: тест красный, агент меняет ожидание — зелёный
  expect(run('rec-run').code).not.toBe(0)
  expect(run('rec-run2').code).toBe(0)
  const changed = (sign: '-' | '+') =>
    find('s12-agent', 'rec-tamper', 'file')
      .diff.filter((line) => line.startsWith(sign) && !line.startsWith(sign.repeat(3)))
      .join('\n')
  expect(changed('-')).toContain('62.5')
  expect(changed('+')).toContain('57.5')
  expect(changed('+')).not.toContain('62.5')
  // приёмка из main: тест в ветке агента ждёт 57.5, а в задаче — 62,5 кг
  expect(run('accept-test').out.join('\n')).toContain('57.5')
  // после возврата работы: ожидание из задачи, исправленный код — зелёный; ветка вливается в main
  expect(run('rec-run3').code).toBe(0)
  expect(run('merge-records').code).toBe(0)
  expect(run('spec-run').code).toBe(0)
  expect(run('log-final').out.join('\n')).toContain('Слияние: личные рекорды')
})

test('s12: шаги по таблице; задачу и токены пишет человек, рекорды, тесты и кнопки — агент; ветка агента влита в main', () => {
  expect(sessions['s12-agent'].events.map((e) => e.id)).toEqual([
    ...['task-file', 'c-task', 'agent-branch'],
    ...['ask-records', 'rec-test', 'rec-lib', 'rec-run', 'rec-tamper', 'rec-run2', 'c-records'],
    ...['main-back', 'accept-log', 'accept-stat', 'accept-test', 'agent-branch2'],
    ...['ask-records-fix', 'rec-untamper', 'rec-fix', 'rec-run3', 'c-records2', 'merge-records'],
    ...['ask-spec-tests', 'spec-test', 'spec-lib', 'spec-chart', 'spec-run', 'c-spec-tests'],
    ...['design-file', 'ask-button', 'button-read', 'ask-button2', 'button-css', 'dev', 'login-anna', 'c-design', 'log-final'],
  ])
  const file = (id: string) => find('s12-agent', id, 'file')
  const run = (id: string) => find('s12-agent', id, 'run')
  const commit = (id: string) => find('s12-agent', id, 'commit')
  const agent = (id: string) => find('s12-agent', id, 'agent')
  const tree = (id: string) => commit(id).files.map((f) => f.path)
  const byAgent = (id: string) => sessions['s12-agent'].events.find((e) => e.id === id) as { by?: string }
  // все шаги внутри шагов агента — с by: "agent", остальные — человека
  const inner = new Set(['ask-records', 'ask-records-fix', 'ask-spec-tests', 'ask-button', 'ask-button2'].flatMap((id) => agent(id).steps))
  for (const e of sessions['s12-agent'].events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }

  // задача фоновому агенту в четыре части по шаблону книги — пишет человек и коммитит в main, продолжение s11
  const task = file('task-file')
  expect(task).toMatchObject({ path: 'docs/tasks/records.md', before: null })
  for (const heading of ['## Задача', '## Контекст', '## Критерии готовности', '## Ограничения']) expect(task.after, heading).toContain(heading)
  expect(task.after).toContain('среди подходов 60 × 8, 62,5 × 5 и 57,5 × 10 рекорд — 62,5 кг')
  expect(task.after).toContain('Не трогать миграции')
  expect(task.after).toContain('ветке `agent/records`')
  expect(commit('c-task')).toMatchObject({ message: 'Задача фоновому агенту: личные рекорды', branch: 'main' })
  expect(commit('c-task').parents).toEqual([find('s11-ship', 'c-plan', 'commit').hash])
  expect(tree('c-task')).toContain('docs/tasks/records.md')
  expect(run('agent-branch').cmd).toBe('git switch -c agent/records')

  // агент: тест по задаче (62.5), код по объёму подхода — красный «expected 57.5 to be 62.5»; подгонка меняет одну строку теста
  const ask = agent('ask-records')
  expect(ask.prompt).toBe('Выполни задачу из docs/tasks/records.md')
  expect(ask.reply.startsWith('Готово, тесты зелёные')).toBe(true)
  expect(ask.steps).toEqual(['rec-test', 'rec-lib', 'rec-run', 'rec-tamper', 'rec-run2'])
  expect(file('rec-test')).toMatchObject({ path: 'lib/records.test.ts', before: null })
  expect(file('rec-test').after).toContain('toBe(62.5)')
  expect(file('rec-lib')).toMatchObject({ path: 'lib/records.ts', before: null })
  expect(file('rec-lib').after).toContain('set.weight * set.reps')
  expect(run('rec-run').cmd).toBe('npx vitest run lib/records.test.ts')
  expect(run('rec-run').out.join('\n')).toContain('expected 57.5 to be 62.5')
  expect(file('rec-tamper').after).toBe(file('rec-test').after.replace('toBe(62.5)', 'toBe(57.5)'))
  expect(run('rec-run2').out.join('\n')).toMatch(/Tests\s+3 passed/)
  const records = commit('c-records')
  expect(records).toMatchObject({ message: 'Личные рекорды', branch: 'agent/records', parents: [commit('c-task').hash] })
  expect(tree('c-records')).toEqual(expect.arrayContaining(['lib/records.ts', 'lib/records.test.ts']))

  // приёмка из main: в main файлов агента нет; один коммит ветки, два файла, тест ждёт 57.5
  expect(run('main-back').cmd).toBe('git switch main')
  expect(run('main-back').files).toEqual(
    expect.arrayContaining([
      { path: 'lib/records.ts', blob: null },
      { path: 'lib/records.test.ts', blob: null },
    ]),
  )
  expect(run('accept-log').cmd).toBe('git log main..agent/records --oneline')
  expect(run('accept-log').out.filter(Boolean)).toEqual([`${records.hash} Личные рекорды`])
  expect(run('accept-stat').cmd).toBe('git diff main agent/records --stat')
  const stat = run('accept-stat').out.join('\n')
  for (const path of ['lib/records.ts', 'lib/records.test.ts', '2 files changed']) expect(stat, path).toContain(path)
  expect(run('accept-test').cmd).toBe('git show agent/records:lib/records.test.ts')
  expect(run('accept-test').out.join('\n')).toContain('toBe(57.5)')
  expect(run('accept-test').out.join('\n')).not.toContain('toBe(62.5)')

  // возврат работы: в ветку агента, ожидание из задачи, рекорд по весу; тест после этого не менялся
  expect(run('agent-branch2').cmd).toBe('git switch agent/records')
  const fix = agent('ask-records-fix')
  expect(fix.prompt).toBe('Тест подогнан под код: в задаче рекорд — 62,5 кг. Верни ожидание из задачи и исправь код, тест не трогай')
  expect(fix.steps).toEqual(['rec-untamper', 'rec-fix', 'rec-run3'])
  expect(file('rec-untamper').after).toBe(file('rec-test').after)
  expect(file('rec-fix').path).toBe('lib/records.ts')
  expect(file('rec-fix').after).not.toContain('set.weight * set.reps')
  expect(file('rec-fix').after).toContain('Math.max(...sets.map((set) => set.weight))')
  expect(run('rec-run3').out.join('\n')).toMatch(/Tests\s+3 passed/)
  expect(commit('c-records2')).toMatchObject({ message: 'Рекорды по весу, как в задаче', branch: 'agent/records', parents: [records.hash] })

  // слияние без перемотки; следующий коммит main — от коммита слияния (его хеш — в графе log-final)
  expect(run('merge-records').cmd).toBe("git switch main && git merge --no-ff agent/records -m 'Слияние: личные рекорды'")
  const log = run('log-final').out
  const mergeHash = log.join('\n').match(/([0-9a-f]{7}) Слияние: личные рекорды/)?.[1]
  expect(mergeHash).toBeDefined()
  expect(commit('c-spec-tests').parents).toEqual([mergeHash])

  // тесты из требований сценария 3: по тесту на требование, маленькая функция progress() и график карточки из неё
  const spec = agent('ask-spec-tests')
  expect(spec.prompt).toBe('Тесты из требований docs/spec.md, сценарий 3 (тренер видит прогресс): по тесту на каждое требование')
  expect(spec.steps).toEqual(['spec-test', 'spec-lib', 'spec-chart', 'spec-run'])
  const specTest = file('spec-test')
  expect(specTest).toMatchObject({ path: 'lib/progress.test.ts', before: null })
  expect(specTest.after.match(/^test\(/gm)).toHaveLength(3)
  for (const name of ['тренер видит, как менялся вес', 'тренер видит, сколько всего поднято за тренировку', 'по неделям 50, 55 и 60 кг — три строки по порядку недель']) {
    expect(specTest.after, name).toContain(`test("${name}"`)
  }
  expect(file('spec-lib')).toMatchObject({ path: 'lib/progress.ts', before: null })
  expect(file('spec-chart').path).toBe('app/clients/[id]/page.tsx')
  expect(file('spec-chart').after).toContain('<ProgressChart data={progress(card.workouts)} />')
  expect(run('spec-run').cmd).toBe('npx vitest run lib/progress.test.ts')
  expect(run('spec-run').out.join('\n')).toMatch(/Tests\s+3 passed/)
  expect(commit('c-spec-tests')).toMatchObject({ message: 'Тесты прогресса из требований', branch: 'main' })
  expect(tree('c-spec-tests')).toEqual(expect.arrayContaining(['lib/records.ts', 'lib/progress.ts', 'lib/progress.test.ts']))

  // дизайн-токены: человек пишет, агент сначала читает и спрашивает (ничего не правит), после ответа — одно правило в globals.css
  const design = file('design-file')
  expect(design).toMatchObject({ path: 'docs/design.md', before: null })
  for (const heading of ['## Цвета', '## Отступы', '## Кнопка', '## Шрифт']) expect(design.after, heading).toContain(heading)
  expect(design.after).toContain('кнопка: высота 44 px — под палец')
  const button = agent('ask-button')
  expect(button.prompt).toBe('Сделай кнопку «Сохранить подход» побольше. Сначала спроси, если неясно')
  expect(button.steps).toEqual(['button-read'])
  expect(button.reply).toContain('Побольше — это высота 44 px из docs/design.md?')
  expect(find('s12-agent', 'button-read', 'read')).toMatchObject({ path: 'docs/design.md', text: design.after })
  const button2 = agent('ask-button2')
  expect(button2.prompt).toBe('Да: все кнопки — 44 px по docs/design.md')
  expect(button2.steps).toEqual(['button-css'])
  expect(file('button-css').path).toBe('app/globals.css')
  expect(file('button-css').after).toContain('--button-height: 44px;')
  expect(file('button-css').after).toContain('min-height: var(--button-height);')

  // приложение после правки: dev-сервер и вход Анны — на её тренировки
  expect(run('dev')).toMatchObject({ cmd: 'npm run dev', code: null })
  expect(run('dev').out.join('\n')).toContain('Ready')
  const login = find('s12-agent', 'login-anna', 'browser')
  expect(login.url).toBe('http://localhost:3000/login')
  expect(login.fields).toEqual([
    { label: 'Почта', value: 'anna@example.com' },
    { label: 'Пароль', value: 'demo-password' },
  ])
  expect(login.urlAfter).toBe('http://localhost:3000/workouts')
  expect(login.buttons).toContain('Войти')

  // последний коммит недели — на main, от c-spec-tests; граф после него ничего не меняет и показывает ветку агента
  const last = commit('c-design')
  expect(last).toMatchObject({ message: 'Кнопки по дизайн-токенам', branch: 'main', parents: [commit('c-spec-tests').hash] })
  expect(tree('c-design')).toEqual(expect.arrayContaining(['docs/design.md', 'app/globals.css', 'docs/tasks/records.md']))
  expect(run('log-final').cmd).toBe('git log --oneline --graph -14')
  expect(run('log-final').files).toBeUndefined()
  for (const c of [last, commit('c-spec-tests'), commit('c-records2'), records, commit('c-task')]) expect(log.join('\n'), c.id).toContain(`${c.hash} ${c.message}`)
  expect(byAgent('log-final').by).toBeUndefined()
})

test('s13: расплывчатая задача трогает четыре файла, задача в четыре части — один; тренер видит заметку', () => {
  const run = (id: string) => find('s13-feedback', id, 'run')
  // «Покажи заметки к подходам получше»: в ветке agent/notes-vague четыре файла вместо одного, ветка удаляется
  const vague = run('vague-stat').out.join('\n')
  for (const path of ['components/SetList.tsx', 'app/workouts/[id]/page.tsx', 'app/globals.css', 'app/clients/page.tsx']) expect(vague, path).toContain(path)
  expect(vague).toContain('4 files changed')
  expect(run('vague-drop').out.join('\n')).toContain('Deleted branch agent/notes-vague')

  // задача в четыре части: приёмка из main — в ветке agent/notes один коммит и один файл
  const notes = find('s13-feedback', 'c-notes', 'commit')
  expect(run('accept-log').out.filter(Boolean)).toEqual([`${notes.hash} ${notes.message}`])
  const stat = run('accept-stat').out.filter(Boolean)
  expect(stat).toHaveLength(2)
  expect(stat[0]).toContain('components/SetList.tsx')
  expect(stat[1]).toContain('1 file changed')

  // агент читает задачу, правит один файл и запускает проверку — она проходит
  expect(find('s13-feedback', 'ask-notes', 'agent').steps).toEqual(['notes-read', 'notes-list', 'notes-check'])
  expect(run('notes-check').code).toBe(0)

  // руками: у Марины на карточке Анны под подходом «50 кг × 10» — заметка «болит колено»
  const card = find('s13-feedback', 'card-note', 'browser').after
  expect(card).toContain('болит колено')
  expect(card[card.indexOf('болит колено') - 1]).toBe('50 кг × 10')
  // кадр тренера: форма назначения тренировки есть только у Марины
  expect(card).toContain('Назначить')
})

test('s14: ссылка с каскадом стирает подходы — тест красный; копия — зелёный; программа на 4 недели', () => {
  const run = (id: string) => find('s14-programs', id, 'run')
  const file = (id: string) => find('s14-programs', id, 'file')
  // Plan: три модели данных — агент только читает модель и план, код не меняет
  const model = find('s14-programs', 'ask-model', 'agent')
  expect(model.steps).toEqual(['m-init', 'm-plan'])
  expect(find('s14-programs', 'm-init', 'read').path).toBe('supabase/migrations/0001_init.sql')
  expect(find('s14-programs', 'm-plan', 'read').path).toBe('docs/plan-weeks-2-3.md')
  expect(model.reply).toMatch(/Какой берём\?$/)

  // вариант 1 — ссылка на строку шаблона с каскадом; миграция применяется
  expect(file('ref-sql').path).toBe('supabase/migrations/0004_programs.sql')
  expect(file('ref-sql').after).toContain('program_item_id bigint not null references program_items (id) on delete cascade')
  expect(file('ref-sql').after).toContain('workout_item_id bigint references workout_items (id) on delete cascade')
  // ошибка 0004 — только каскад: строку тренировки тренер вставляет лишь из своей программы
  expect(file('ref-sql').after).toMatch(/and program_item_id in \(\s+select pi\.id from program_items pi join programs p on p\.id = pi\.program_id where p\.coach_id = auth\.uid\(\)\)/)
  expect(run('ref-apply').cmd).toBe('psql -f supabase/migrations/0004_programs.sql')
  expect(run('ref-apply').code).toBe(0)
  expect(run('ref-apply').out.join('\n')).not.toContain('ERROR')

  // тест из требования красный: каскад стёр подходы прошлой тренировки
  expect(run('prog-red').cmd).toBe('npx vitest run test/programs.test.ts')
  expect(run('prog-red').code).not.toBe(0)
  expect(run('prog-red').out.join('\n')).toContain('подходов: expected +0 to be 3')

  // копия вместо ссылки: тот же тест зелёный
  expect(file('copy-sql').path).toBe('supabase/migrations/0005_programs_copy.sql')
  expect(file('copy-sql').after).toContain('on delete set null')
  // копия в строке тренировки — свои столбцы упражнения, подходов и повторов
  for (const column of ['add column exercise_id bigint references exercises (id)', 'add column sets int', 'add column reps int']) {
    expect(file('copy-sql').after, column).toContain(column)
  }
  expect(file('copy-sql').after).toContain('set search_path = public')
  // красный и зелёный прогоны — на одном тесте: файл теста пишет только prog-test
  const testWrites = sessions['s14-programs'].events.filter((e) => e.kind === 'file' && e.path === 'test/programs.test.ts')
  expect(testWrites.map((e) => e.id)).toEqual(['prog-test'])
  expect(run('copy-apply').code).toBe(0)
  expect(run('copy-apply').out.join('\n')).not.toContain('ERROR')
  expect(run('prog-green').cmd).toBe('npx vitest run test/programs.test.ts')
  expect(run('prog-green').code).toBe(0)
  expect(find('s14-programs', 'ask-copy', 'agent').steps).toEqual(['copy-sql', 'copy-apply', 'prog-green'])

  // программа на 4 недели с введённой даты: у Анны четыре тренировки «Ноги, 4 недели», в первой — присед 3 × 10
  const assign = find('s14-programs', 'program-assign', 'browser')
  expect(assign.fields).toContainEqual({ label: 'С даты', value: '2026-11-09' })
  // после «Назначить» кадр меняется: подтверждение на странице программ
  expect(assign.urlAfter).toBe('http://localhost:3000/programs?assigned=4')
  expect(assign.before).not.toContain('Назначено тренировок: 4')
  expect(assign.after).toContain('Назначено тренировок: 4')
  const week = find('s14-programs', 'anna-week', 'browser').after
  for (const day of ['9 ноября', '16 ноября', '23 ноября', '30 ноября']) expect(week, day).toContain(day)
  expect(week.filter((line) => line === 'Ноги, 4 недели')).toHaveLength(4)
  const items = find('s14-programs', 'anna-items', 'browser')
  expect(items.url).toBe('http://localhost:3000/workouts/6')
  expect(items.after).toContain('Ноги, 4 недели')
  expect(items.after).toContain('Присед — 3 × 10')
})

test('s15: схема после 0004–0005 — копия; тесты до кода; пустая неделя NaN, затем «тренировок не было»', () => {
  const events = sessions['s15-report'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['schema', 'report-def', 'c-report-def'],
    ...['ask-report-tests', 'report-test', 'report-red', 'ask-report-code', 'report-lib', 'report-page', 'report-green'],
    ...['dev', 'login-marina', 'report-view', 'report-rule'],
    ...['ask-empty', 'empty-test', 'empty-red', 'empty-fix', 'empty-page', 'empty-green', 'report-view2', 'c-report'],
  ])
  const run = (id: string) => find('s15-report', id, 'run')
  const file = (id: string) => find('s15-report', id, 'file')
  const agent = (id: string) => find('s15-report', id, 'agent')
  const commit = (id: string) => find('s15-report', id, 'commit')
  // шаги внутри запросов — агента, остальные — человека: определения и правило пишет человек
  const inner = new Set(['ask-report-tests', 'ask-report-code', 'ask-empty'].flatMap((id) => agent(id).steps))
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }

  // Review Focus 1: миграции 0001–0005 рекордер применил подряд на чистой базе — в строке тренировки копия, связь со шаблоном set null
  expect(run('schema').cmd).toBe('psql -c "\\d workout_items"')
  expect(run('schema').code).toBe(0)
  const schema = run('schema').out.join('\n')
  for (const column of ['exercise_id', 'sets', 'reps', 'program_item_id']) expect(schema, column).toMatch(new RegExp(`^ ${column} +\\|`, 'm'))
  // set null — именно у связи строки тренировки со строкой шаблона
  expect(schema).toMatch(/FOREIGN KEY \(program_item_id\) REFERENCES program_items\(id\) ON DELETE SET NULL$/m)

  // определения словами — до тестов и кода; месяц — в адресе; про пустую неделю ничего не сказано
  const def = file('report-def')
  expect(def).toMatchObject({ path: 'docs/report.md', before: null })
  for (const words of ['с понедельника по воскресенье', '28 сентября — 4 октября', 'lib/records.ts', '/report?month=2026-10']) expect(def.after, words).toContain(words)
  expect(def.after).toContain('Тренировок — 2, объём — 2740 кг, средний объём — 1370 кг')
  expect(def.after).not.toContain('тренировок не было')
  expect(commit('c-report-def').message).toBe('Отчёт тренера словами')
  // в коммите определений — документ, а тестов и кода отчёта ещё нет (files коммита — всё дерево)
  const defTree = commit('c-report-def').files.map((f) => f.path)
  expect(defTree).toContain('docs/report.md')
  for (const path of ['lib/report.test.ts', 'lib/report.ts', 'app/report/page.tsx']) expect(defTree, path).not.toContain(path)

  // тесты до кода: сначала красный — модуля нет, после кода — зелёный
  expect(agent('ask-report-tests').prompt).toBe('Сначала тесты из docs/report.md, код потом')
  expect(agent('ask-report-tests').steps).toEqual(['report-test', 'report-red'])
  expect(file('report-test')).toMatchObject({ path: 'lib/report.test.ts', before: null })
  expect(file('report-test').after).toContain('volume: 1500 + 1240')
  for (const id of ['report-red', 'report-green', 'empty-red', 'empty-green']) expect(run(id).cmd, id).toBe('npx vitest run lib/report.test.ts')
  expect(run('report-red').code).not.toBe(0)
  expect(run('report-red').out.join('\n')).toContain("Cannot find module './report'")
  expect(agent('ask-report-code').prompt).toBe('Теперь код: lib/report.ts и страница /report?month=2026-10 у тренера')
  expect(agent('ask-report-code').steps).toEqual(['report-lib', 'report-page', 'report-green'])
  expect(file('report-lib').path).toBe('lib/report.ts')
  expect(file('report-lib').after).toContain('import { records } from "./records";')
  expect(file('report-page').path).toBe('app/report/page.tsx')
  expect(run('report-green').code).toBe(0)

  // отчёт за октябрь по неделям у Марины: месяц — из адреса, у обоих подопечных пять недель
  const view = find('s15-report', 'report-view', 'browser')
  expect(view.url).toBe('http://localhost:3000/report?month=2026-10')
  expect(view.after[0]).toBe('Отчёт за октябрь 2026')
  const weeks = ['28 сентября — 4 октября', '5–11 октября', '12–18 октября', '19–25 октября', '26 октября — 1 ноября']
  for (const week of weeks) expect(view.after.filter((line) => line === week), week).toHaveLength(2)
  // неделя Анны 19–25 октября — как в примере docs/report.md
  const anna = view.after.indexOf('19–25 октября')
  expect(view.after.indexOf('Анна')).toBeLessThan(anna)
  expect(view.after.slice(anna, anna + 5)).toEqual([
    '19–25 октября',
    'Тренировок: 2',
    'Объём: 2740 кг',
    'Средний объём: 1370 кг',
    'Рекорды на конец недели: Ноги — 50 кг, Спина и бицепс — 45 кг',
  ])
  // неделя 26 октября — 1 ноября тоже с числами: у Анны одна тренировка, «Грудь и плечи» 26 октября
  const nextWeek = view.after.indexOf('26 октября — 1 ноября')
  expect(nextWeek).toBeGreaterThan(anna)
  expect(view.after.slice(nextWeek, nextWeek + 4)).toEqual(['26 октября — 1 ноября', 'Тренировок: 1', 'Объём: 880 кг', 'Средний объём: 880 кг'])
  // подводный камень: у пустых недель 0 / 0 — на экране NaN
  expect(view.after.join('\n')).toContain('NaN')
  expect(view.after.filter((line) => line === 'Средний объём: NaN кг')).toHaveLength(6)

  // правило решает человек, дальше — тест красный, код, тест зелёный
  expect(file('report-rule').path).toBe('docs/report.md')
  expect(file('report-rule').after).toContain('## Неделя без тренировок')
  expect(file('report-rule').after).toContain('«тренировок не было»')
  expect(agent('ask-empty').prompt).toBe('В docs/report.md новое правило про пустую неделю. Сначала тест, потом код')
  expect(agent('ask-empty').steps).toEqual(['empty-test', 'empty-red', 'empty-fix', 'empty-page', 'empty-green'])
  expect(file('empty-test').after).toContain('"2026-10-05"')
  expect(run('empty-red').code).not.toBe(0)
  expect(run('empty-red').out.join('\n')).toContain('средний: expected NaN to be null')
  expect(file('empty-fix').path).toBe('lib/report.ts')
  expect(file('empty-page').path).toBe('app/report/page.tsx')
  expect(run('empty-green').code).toBe(0)

  // после правила: «тренировок не было», NaN нет
  const view2 = find('s15-report', 'report-view2', 'browser').after
  expect(view2.join('\n')).toContain('тренировок не было')
  expect(view2.join('\n')).not.toContain('NaN')
  expect(view2.filter((line) => line === 'тренировок не было')).toHaveLength(6)
  expect(view2).toContain('Средний объём: 1370 кг')

  // коммит — продолжение c-report-def на main
  const last = commit('c-report')
  expect(last).toMatchObject({ message: 'Отчёт тренера за месяц по неделям', branch: 'main', parents: [commit('c-report-def').hash] })
  expect(last.files.map((f) => f.path)).toEqual(expect.arrayContaining(['docs/report.md', 'lib/report.ts', 'lib/report.test.ts', 'app/report/page.tsx']))
})

test('s16: таблица из SQL без RLS — Света видит колено Анны; с RLS — 0 строк; одно уведомление на тренировку', () => {
  const events = sessions['s16-comments'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['ask-comments', 'comments-sql', 'comments-apply', 'comments-action', 'comments-ui', 'comments-anna', 'comments-coach'],
    ...['dev', 'login-anna', 'anna-comment', 'login-marina', 'marina-reply', 'as-sveta-file', 'as-sveta', 'as-sveta-write-file', 'as-sveta-write'],
    ...['ask-comments-rls', 'rls-sql', 'rls-apply', 'comments-test', 'comments-run', 'as-sveta2', 'as-sveta-write2'],
    ...['ask-notify', 'notify-test', 'notify-lib', 'notify-run', 'c-comments'],
  ])
  const run = (id: string) => find('s16-comments', id, 'run')
  const file = (id: string) => find('s16-comments', id, 'file')
  const agent = (id: string) => find('s16-comments', id, 'agent')
  const browser = (id: string) => find('s16-comments', id, 'browser')
  // шаги внутри запросов — агента, остальные — человека: проверку от имени Светы пишет и запускает человек
  const inner = new Set(['ask-comments', 'ask-comments-rls', 'ask-notify'].flatMap((id) => agent(id).steps))
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }

  // комментарии: таблица из SQL, миграция — с подтверждения; RLS агент не включил
  expect(agent('ask-comments').prompt).toBe('Комментарии к тренировке: подопечный пишет под тренировкой, тренер отвечает. Миграцию применяй с моего подтверждения')
  expect(agent('ask-comments').steps).toEqual(['comments-sql', 'comments-apply', 'comments-action', 'comments-ui', 'comments-anna', 'comments-coach'])
  const table = file('comments-sql')
  expect(table).toMatchObject({ path: 'supabase/migrations/0006_comments.sql', before: null })
  for (const column of ['workout_id bigint', 'author_id uuid', 'body text', 'char_length(body) between 1 and 1000', 'created_at timestamptz']) expect(table.after, column).toContain(column)
  expect(table.after).not.toMatch(/row level security|create policy/i)
  expect(run('comments-apply')).toMatchObject({ cmd: 'psql -f supabase/migrations/0006_comments.sql', code: 0, out: ['CREATE TABLE'] })
  expect(['comments-action', 'comments-ui', 'comments-anna', 'comments-coach'].map((id) => file(id).path)).toEqual([
    'app/workouts/[id]/comments.ts',
    'components/Comments.tsx',
    'app/workouts/[id]/page.tsx',
    'app/clients/[id]/page.tsx',
  ])
  expect(file('comments-anna').before).not.toBeNull()
  expect(file('comments-coach').before).not.toBeNull()

  // строки для кадра создаёт сама сессия: Анна пишет под «Ногами», Марина отвечает на карточке
  const KNEE = 'Последний подход тяжело, ноет колено'
  const THURSDAY = 'Тогда в четверг присед полегче'
  expect(browser('login-anna').urlAfter).toBe('http://localhost:3000/workouts')
  const anna = browser('anna-comment')
  expect(anna.url).toBe('http://localhost:3000/workouts/1')
  expect(anna.fields).toEqual([{ label: 'Комментарий', value: KNEE }])
  expect(anna.before).toContain('Комментариев пока нет')
  expect(anna.after).toContain(`Анна: ${KNEE}`)
  expect(browser('login-marina').urlAfter).toBe('http://localhost:3000/clients')
  const reply = browser('marina-reply')
  expect(reply.url).toBe('http://localhost:3000/clients/1')
  expect(reply.fields).toEqual([{ label: 'Комментарий', value: THURSDAY }])
  // до ответа: комментарий Анны — под «Ногами», раньше следующей тренировки
  const knee = reply.before.indexOf(`Анна: ${KNEE}`)
  expect(knee).toBeGreaterThan(reply.before.indexOf('Ноги'))
  expect(knee).toBeLessThan(reply.before.indexOf('Спина и бицепс'))
  // после ответа — обе реплики
  expect(reply.after.join('\n')).toContain(KNEE)
  expect(reply.after.join('\n')).toContain(THURSDAY)
  expect(reply.after.indexOf(`Тренер: ${THURSDAY}`)).toBe(reply.after.indexOf(`Анна: ${KNEE}`) + 1)

  // подводный камень: запрос от имени Светы, подопечной Игоря, — она видит оба комментария
  const sveta = file('as-sveta-file')
  expect(sveta).toMatchObject({ path: 'supabase/tests/as-sveta.sql', before: null })
  for (const line of ['set local role authenticated;', '"sub":"55555555-5555-5555-5555-555555555555"', 'select body from comments;', 'rollback;']) expect(sveta.after, line).toContain(line)
  expect(run('as-sveta').cmd).toBe('psql -f supabase/tests/as-sveta.sql')
  const seen = run('as-sveta').out.join('\n')
  expect(seen).toContain('ноет колено')
  expect(seen).toContain(THURSDAY)
  expect(seen).toContain('(2 rows)')
  // вторая дверь — запись: вставка от имени Светы под «Ногами» проходит, и Анна видит её с подписью «Тренер»
  const write = file('as-sveta-write-file')
  expect(write).toMatchObject({ path: 'supabase/tests/as-sveta-write.sql', before: null })
  for (const line of ["values (1, '55555555-5555-5555-5555-555555555555', 'Привет от Светы');", '"sub":"33333333-3333-3333-3333-333333333333"', 'rollback;']) expect(write.after, line).toContain(line)
  expect(run('as-sveta-write').cmd).toBe('psql -f supabase/tests/as-sveta-write.sql')
  const wrote = run('as-sveta-write').out
  expect(wrote).toContain('INSERT 0 1')
  expect(wrote).toContain(' Тренер | Привет от Светы')
  expect(wrote.join('\n')).not.toContain('ERROR')

  // RLS: читают и пишут подопечный и тренер, автор — от своего имени; негативный тест зелёный
  expect(agent('ask-comments-rls').prompt).toBe(
    'Света, подопечная Игоря, видит комментарии чужой подопечной. Включи RLS на comments: читают и пишут подопечный тренировки и его тренер, от своего имени. И негативный тест',
  )
  expect(agent('ask-comments-rls').steps).toEqual(['rls-sql', 'rls-apply', 'comments-test', 'comments-run'])
  const rls = file('rls-sql')
  expect(rls).toMatchObject({ path: 'supabase/migrations/0007_comments_rls.sql', before: null })
  expect(rls.after).toContain('alter table comments enable row level security;')
  expect(rls.after).toContain('author_id = auth.uid()')
  expect(rls.after.match(/create policy/g)).toHaveLength(2)
  expect(run('rls-apply')).toMatchObject({ cmd: 'psql -f supabase/migrations/0007_comments_rls.sql', code: 0, out: ['ALTER TABLE', 'CREATE POLICY', 'CREATE POLICY'] })
  expect(file('comments-test')).toMatchObject({ path: 'test/comments.test.ts', before: null })
  const names = ['Света, подопечная Игоря, не видит комментарий Анны', 'Анна видит свой комментарий', 'Марина, тренер Анны, видит комментарий Анны']
  for (const name of [...names, 'Света не может написать под тренировкой Анны', 'Анна не может написать от имени Марины']) {
    expect(file('comments-test').after, name).toContain(`test("${name}"`)
  }
  expect(run('comments-run').cmd).toBe('npx vitest run test/comments.test.ts')
  expect(run('comments-run').code).toBe(0)
  expect(run('comments-run').out.join('\n')).toContain('5 passed (5)')
  // тот же запрос от Светы после RLS — пусто
  expect(run('as-sveta2').cmd).toBe('psql -f supabase/tests/as-sveta.sql')
  const empty = run('as-sveta2').out.join('\n')
  expect(empty).toContain('(0 rows)')
  expect(empty).not.toContain('колено')
  // та же вставка после RLS — ошибка политики, у Анны комментария Светы нет
  expect(run('as-sveta-write2').cmd).toBe('psql -f supabase/tests/as-sveta-write.sql')
  const refused = run('as-sveta-write2').out.join('\n')
  expect(refused).toContain('ERROR:  new row violates row-level security policy for table "comments"')
  expect(refused).not.toContain('INSERT 0 1')
  expect(refused).not.toContain('Привет от Светы')

  // уведомления: сначала тест, потом код; время в тесте фиксированное, настоящих часов нет ни в тесте, ни в коде
  expect(agent('ask-notify').prompt).toBe('Уведомление тренеру — одно на тренировку, а не на каждый подход. Ночью с 22 до 8 по часовому поясу получателя — утром. Сначала тест')
  expect(agent('ask-notify').steps).toEqual(['notify-test', 'notify-lib', 'notify-run'])
  const notifyTest = file('notify-test')
  expect(notifyTest).toMatchObject({ path: 'lib/notify.test.ts', before: null })
  for (const words of ['length: 15', '"Europe/Moscow"', '2026-11-07T23:40:00+03:00', '2026-11-08T08:00:00+03:00']) expect(notifyTest.after, words).toContain(words)
  // 15 подходов — ровно одно уведомление: в ожидании один элемент
  expect(notifyTest.after).toContain('expect(coachNotices(sets, MOSCOW)).toEqual([{ workoutId: "1", sendAt: new Date("2026-11-07T18:00:00+03:00") }]);')
  expect(file('notify-lib')).toMatchObject({ path: 'lib/notify.ts', before: null })
  for (const id of ['notify-test', 'notify-lib']) expect(file(id).after, id).not.toMatch(/Date\.now\(|new Date\(\)/)
  expect(run('notify-run').cmd).toBe('npx vitest run lib/notify.test.ts')
  expect(run('notify-run').code).toBe(0)
  expect(run('notify-run').out.join('\n')).toContain('2 passed (2)')

  // коммит — продолжение s15 на main, в нём всё новое
  const last = find('s16-comments', 'c-comments', 'commit')
  expect(last).toMatchObject({ message: 'Комментарии к тренировке с RLS; правила уведомлений', branch: 'main', parents: [find('s15-report', 'c-report', 'commit').hash] })
  const paths = ['supabase/migrations/0006_comments.sql', 'supabase/migrations/0007_comments_rls.sql', 'supabase/tests/as-sveta.sql', 'supabase/tests/as-sveta-write.sql', 'components/Comments.tsx']
  expect(last.files.map((f) => f.path)).toEqual(expect.arrayContaining([...paths, 'app/workouts/[id]/comments.ts', 'test/comments.test.ts', 'lib/notify.ts', 'lib/notify.test.ts']))
})

test('s17: вечная ссылка пускает Кирилла; одноразовое приглашение — второй раз нельзя; аудит только читает', () => {
  const events = sessions['s17-invite'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['ask-join', 'join-page', 'join-action', 'invite-link', 'dev', 'login-marina', 'marina-link', 'olga-join', 'kirill-join', 'clients-db'],
    ...['ask-invite', 'inv-test', 'inv-sql', 'inv-apply', 'inv-old', 'inv-page', 'inv-action', 'inv-link', 'inv-run'],
    ...['login-marina2', 'invite-new', 'vera-join', 'invite-reuse', 'ask-audit', 'a-action', 'a-sql', 'c-invite'],
  ])
  const run = (id: string) => find('s17-invite', id, 'run')
  const file = (id: string) => find('s17-invite', id, 'file')
  const read = (id: string) => find('s17-invite', id, 'read')
  const agent = (id: string) => find('s17-invite', id, 'agent')
  const browser = (id: string) => find('s17-invite', id, 'browser')
  // шаги внутри запросов — агента, остальные — человека: браузер и psql
  const inner = new Set(['ask-join', 'ask-invite', 'ask-audit'].flatMap((id) => agent(id).steps))
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }
  const MARINA = '11111111-1111-1111-1111-111111111111'
  const BASE = 'http://localhost:3000'

  // наивно: тренер из адреса /join/<id тренера>; регистрация — auth.users с crypt(), профиль подопечного, подопечный, вход
  expect(agent('ask-join').prompt).toBe('Приглашение по ссылке: тренер даёт ссылку /join/…, человек вводит имя, почту и пароль и становится его подопечным')
  expect(agent('ask-join').steps).toEqual(['join-page', 'join-action', 'invite-link'])
  expect(file('join-page')).toMatchObject({ path: 'app/join/[coach]/page.tsx', before: null })
  expect(file('join-page').after).toContain('PageProps<"/join/[coach]">')
  const naive = file('join-action')
  expect(naive).toMatchObject({ path: 'app/join/[coach]/actions.ts', before: null })
  for (const words of [
    "insert into auth.users (email, encrypted_password) values ($1, crypt($2, gen_salt('bf')))",
    "insert into profiles (id, role, name) values ($1, 'client', $2)",
    'insert into clients (coach_id, user_id, name) values ($1, $2, $3)", [coach, uid, name]',
    'await startSession(uid);',
    '=== "23505"',
  ]) expect(naive.after, words).toContain(words)
  // почта хранится так, как её ищет вход (app/api/login): без пробелов по краям, буквы как ввели; та же почта другими буквами — занята
  expect(naive.after).toContain('const email = String(form.get("email") ?? "").trim();')
  expect(naive.after).not.toContain('toLowerCase')
  expect(naive.after).toContain('select 1 from auth.users where lower(email) = lower($1)')
  expect(file('invite-link')).toMatchObject({ path: 'app/clients/page.tsx' })
  expect(file('invite-link').before).not.toBeNull()
  expect(file('invite-link').after).toContain('/join/${uid}')

  // Марина видит вечную ссылку; по ней Ольга, а по пересланной — Кирилл становятся её подопечными
  expect(browser('login-marina').urlAfter).toBe(`${BASE}/clients`)
  const link = browser('marina-link')
  expect(link.url).toBe(`${BASE}/clients`)
  expect(link.after).toContain('Ссылка-приглашение')
  expect(link.after).toContain(`${BASE}/join/${MARINA}`)
  for (const [id, name, email] of [['olga-join', 'Ольга', 'olga@example.com'], ['kirill-join', 'Кирилл', 'kirill@example.com']]) {
    const join = browser(id)
    expect(join.url, id).toBe(`${BASE}/join/${MARINA}`)
    expect(join.fields, id).toEqual([{ label: 'Имя', value: name }, { label: 'Почта', value: email }, { label: 'Пароль', value: 'demo-password' }])
    expect(join.before, id).toContain('Тренер Марина приглашает вас в дневник тренировок.')
    expect(join.urlAfter, id).toBe(`${BASE}/workouts`)
    expect(join.network, id).toEqual([])
  }
  expect(run('clients-db')).toMatchObject({ cmd: `psql -c "select name from clients where coach_id = '${MARINA}' order by id"`, code: 0 })
  expect(run('clients-db').out).toEqual(['  name  ', '--------', ' Анна', ' Олег', ' Ольга', ' Кирилл', '(4 rows)'])

  // исправление: сначала тест, затем таблица и функция базы, старая папка — rm (наивный код не коммитился), страница, действие, ссылка
  expect(agent('ask-invite').prompt).toBe(
    'Ссылка вечная и многоразовая: её переслали — и Кирилл стал подопечным Марины. Сделай приглашение одноразовым: длинный случайный код, срок 48 часов, тренер — из записи приглашения, отзыв. Сначала тесты',
  )
  expect(agent('ask-invite').reply).toContain('тренера база берёт из записи приглашения')
  expect(agent('ask-invite').steps).toEqual(['inv-test', 'inv-sql', 'inv-apply', 'inv-old', 'inv-page', 'inv-action', 'inv-link', 'inv-run'])
  const test = file('inv-test')
  expect(test).toMatchObject({ path: 'test/invites.test.ts', before: null })
  const names = [
    'принятое приглашение — подопечный тренера из записи приглашения',
    'второй раз — «уже использовано»',
    'отозванное приглашение — отказ',
    'созданное 49 часов назад — «срок истёк»',
    'подопечный приглашений не создаёт',
  ]
  for (const name of names) expect(test.after, name).toContain(`test("${name}"`)
  // тренер из записи: приглашения Марины и Игоря, принявший приглашение Игоря — подопечный Игоря
  expect(test.after).toContain('expect(coaches).toEqual([IGOR, MARINA]);')
  // просроченное — вставка «из прошлого», настоящие часы тест не ждёт
  expect(test.after).toContain("now() - interval '49 hours'")
  expect(test.after).not.toMatch(/Date\.now\(|new Date\(|setTimeout|useFakeTimers/)
  const sql = file('inv-sql')
  expect(sql).toMatchObject({ path: 'supabase/migrations/0008_invites.sql', before: null })
  for (const words of [
    "code text not null unique default encode(gen_random_bytes(16), 'hex')",
    'coach_id uuid not null references profiles (id)',
    "expires_at timestamptz not null default now() + interval '48 hours'",
    'accepted_by uuid references profiles (id)',
    'revoked_at timestamptz',
    'alter table invites enable row level security;',
    'for update;',
    'insert into clients (coach_id, user_id, name) values (invite.coach_id, new_user, client_name);',
    'revoke execute on function accept_invite(text, uuid, text) from public, anon, authenticated;',
  ]) expect(sql.after, words).toContain(words)
  expect(sql.after.match(/create policy/g)).toHaveLength(3)
  // создаёт приглашение только тренер: подопечный не пригласит к себе
  expect(sql.after).toContain("coach_id = auth.uid() and auth.uid() in (select id from profiles where role = 'coach')")
  // -q: без строк CREATE TABLE… (иначе восемь шагов не помещаются в окно агента); ошибок нет — вывод пустой
  expect(run('inv-apply')).toMatchObject({ cmd: 'psql -q -f supabase/migrations/0008_invites.sql', code: 0, out: [] })
  expect(run('inv-old')).toMatchObject({ cmd: "rm -r 'app/join/[coach]'", code: 0, out: [] })
  expect(run('inv-old').files).toEqual([{ path: 'app/join/[coach]/actions.ts', blob: null }, { path: 'app/join/[coach]/page.tsx', blob: null }])
  expect(file('inv-page')).toMatchObject({ path: 'app/join/[code]/page.tsx', before: null })
  for (const words of ['Приглашение уже использовано', 'Приглашение отозвано', 'Срок приглашения истёк']) expect(file('inv-page').after, words).toContain(words)
  const action = file('inv-action')
  expect(action).toMatchObject({ path: 'app/join/[code]/actions.ts', before: null })
  // тренер — из записи приглашения: подопечного записывает accept_invite в базе, а не действие по адресу
  expect(action.after).toContain('select accept_invite($1, $2, $3)')
  expect(action.after).not.toContain('insert into clients')
  const links = file('inv-link')
  expect(links.path).toBe('app/clients/page.tsx')
  for (const words of ['Создать приглашение', 'Отозвать', 'insert into invites (coach_id) values ($1)', 'update invites set revoked_at = now()']) expect(links.after, words).toContain(words)
  expect(links.after).not.toContain('/join/${uid}')
  expect(run('inv-run')).toMatchObject({ cmd: 'npx vitest run test/invites.test.ts', code: 0 })
  expect(run('inv-run').out.join('\n')).toContain('6 passed (6)')

  // одноразовое приглашение: Марина создаёт, Вера регистрируется, второй раз — «уже использовано»
  expect(browser('login-marina2').urlAfter).toBe(`${BASE}/clients`)
  const created = browser('invite-new')
  expect(created.url).toBe(`${BASE}/clients`)
  expect(created.before).toContain('Приглашений пока нет')
  expect(created.after.join('\n')).toMatch(/\/join\/[0-9a-f]{32}/)
  const invite = created.after.join('\n').match(/\/join\/[0-9a-f]{32}/)![0]
  const vera = browser('vera-join')
  expect(vera.url).toBe(BASE + invite)
  expect(vera.fields).toEqual([{ label: 'Имя', value: 'Вера' }, { label: 'Почта', value: 'vera@example.com' }, { label: 'Пароль', value: 'demo-password' }])
  expect(vera.before).toContain('Тренер Марина приглашает вас в дневник тренировок. Ссылка одноразовая.')
  expect(vera.urlAfter).toBe(`${BASE}/workouts`)
  const reuse = browser('invite-reuse')
  expect(reuse.url).toBe(BASE + invite)
  expect(reuse.after).toContain('Приглашение уже использовано')
  expect(reuse.buttons).not.toContain('Присоединиться')
  // на страницах нет настоящих дат: у Анны и Олега — дни тренировок из seed.sql, у приглашения дат нет
  const DATES = /\d{4}-\d\d-\d\d|\d\d?\.\d\d?\.\d{2,4}|\d\d?:\d\d|\d\d? (?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/g
  expect(created.after.join('\n').match(DATES)).toEqual(['26 октября', '27 октября'])
  expect(reuse.after.join('\n').match(DATES)).toBeNull()

  // аудит в Plan: только два чтения и отчёт, код не меняется
  expect(agent('ask-audit').prompt).toBe(
    'Проверь приглашения по шести вопросам главы 8: откуда данные, кто может вызвать, что сделает злоумышленник, что в журналах, какие права у процесса, что изменилось вне задачи. Код не меняй — только отчёт и места, где не уверен',
  )
  expect(agent('ask-audit').steps).toEqual(['a-action', 'a-sql'])
  expect(read('a-action')).toMatchObject({ path: 'app/join/[code]/actions.ts', blob: action.blob })
  expect(read('a-sql')).toMatchObject({ path: 'supabase/migrations/0008_invites.sql', blob: sql.blob })
  const audit = agent('ask-audit').reply
  for (const n of ['1.', '2.', '3.', '4.', '5.', '6.']) expect(audit, n).toContain(n)
  // нет лимита попыток — находка в пункте 3 («что сделает злоумышленник»); lib/db.ts агент не читал — только «стоит сверить»
  expect(audit.indexOf('лимита попыток на /join нет')).toBeGreaterThan(audit.indexOf('3.'))
  expect(audit.indexOf('лимита попыток на /join нет')).toBeLessThan(audit.indexOf('4.'))
  expect(audit).toContain('стоит сверить, что об этом сказано в lib/db.ts')

  // коммит — продолжение s16 на main: приглашения есть, наивной папки нет
  const last = find('s17-invite', 'c-invite', 'commit')
  expect(last).toMatchObject({ message: 'Приглашение по одноразовой ссылке', branch: 'main', parents: [find('s16-comments', 'c-comments', 'commit').hash] })
  const paths = last.files.map((f) => f.path)
  expect(paths).toEqual(expect.arrayContaining(['supabase/migrations/0008_invites.sql', 'test/invites.test.ts', 'app/join/[code]/page.tsx', 'app/join/[code]/actions.ts', 'app/clients/page.tsx']))
  expect(paths.filter((path) => path.startsWith('app/join/[coach]'))).toEqual([])
})

test('s18: копия эталона — пять файлов и удалённая ветка; подход в одно касание — сквозной тест и тренер видит', () => {
  const events = sessions['s18-quick-set'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['complaints', 'c-complaints', 'copy-branch'],
    ...['ask-copy', 'copy-chat', 'copy-timer', 'copy-timer-use', 'copy-pay', 'copy-pay-lib', 'c-copy', 'copy-stat', 'copy-drop', 'parity-edit'],
    ...['ask-quick', 'quick-e2e', 'quick-page', 'quick-action', 'quick-clients', 'quick-run', 'c-quick'],
    ...['dev', 'login-anna', 'quick-tap', 'quick-after', 'login-marina', 'clients-last'],
  ])
  const run = (id: string) => find('s18-quick-set', id, 'run')
  const file = (id: string) => find('s18-quick-set', id, 'file')
  const agent = (id: string) => find('s18-quick-set', id, 'agent')
  const browser = (id: string) => find('s18-quick-set', id, 'browser')
  const commit = (id: string) => find('s18-quick-set', id, 'commit')
  // шаги внутри запросов — агента, остальные — человека: документы, git, браузер
  const inner = new Set(['ask-copy', 'ask-quick'].flatMap((id) => agent(id).steps))
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }

  // жалобы — в стопки, сверху «долго записывать подход» (А, Б) и «тренер не видит, что я сделал» (Б, В); названий продуктов нет
  const complaints = file('complaints')
  expect(complaints).toMatchObject({ path: 'docs/complaints.md', before: null })
  const stacks = complaints.after.split('\n').filter((line) => line.startsWith('## '))
  expect(stacks.slice(0, 2)).toEqual(['## Долго записывать подход — А, Б', '## Тренер не видит, что я сделал — Б, В'])
  expect(complaints.after).toContain('«Тренер видит вес и повторы подопечного»')
  expect(complaints.after).toContain('Отличие: подход в одно касание, и тренер сразу видит вес, повторы и рост.')
  expect(commit('c-complaints')).toMatchObject({ message: 'Жалобы на эталоны в стопки', branch: 'main', parents: [find('s17-invite', 'c-invite', 'commit').hash] })

  // «как у эталонов» (чат и оплата — Б, таймер — А) в ветке copy/etalon-b: пять файлов агента — и git diff --stat называет ровно их
  expect(agent('ask-copy').prompt).toBe('Сделай как у эталонов: чат и оплату как у Б, таймер отдыха как у А')
  const copySteps = ['copy-chat', 'copy-timer', 'copy-timer-use', 'copy-pay', 'copy-pay-lib']
  expect(agent('ask-copy').steps).toEqual(copySteps)
  const copied = copySteps.map((id) => file(id).path)
  expect(copied).toEqual(['app/chat/page.tsx', 'components/RestTimer.tsx', 'app/workouts/[id]/page.tsx', 'app/billing/page.tsx', 'lib/payments.ts'])
  // три новых файла и две правки существующих (lib/payments.ts — заготовка s09)
  expect(copySteps.map((id) => file(id).before === null)).toEqual([true, true, false, true, false])
  expect(commit('c-copy')).toMatchObject({ message: 'Как у эталона Б', branch: 'copy/etalon-b', parents: [commit('c-complaints').hash] })
  expect(run('copy-stat')).toMatchObject({ cmd: 'git diff main copy/etalon-b --stat', code: 0 })
  const stat = run('copy-stat').out.filter(Boolean)
  expect(stat).toHaveLength(6)
  for (const path of copied) expect(stat.some((line) => line.trimStart().startsWith(`${path} `)), path).toBe(true)
  expect(stat[5]).toContain('5 files changed')
  expect(run('copy-drop')).toMatchObject({ cmd: 'git switch main && git branch -D copy/etalon-b', code: 0 })
  expect(run('copy-drop').out.join('\n')).toContain('Deleted branch copy/etalon-b')

  // паритет: четыре решения шага 5 в колонке «Наше», колонки эталонов — как в разборе
  const parity = file('parity-edit')
  expect(parity.path).toBe('docs/parity.md')
  const rows = (text: string) => text.split('\n').filter((line) => line.startsWith('| ') && !line.startsWith('| Сценарий'))
  const cells = (row: string) => row.split('|').slice(1, -1).map((cell) => cell.trim())
  const was = new Map(rows(parity.before!).map((row) => [cells(row)[0], cells(row)]))
  const now = new Map(rows(parity.after).map((row) => [cells(row)[0], cells(row)]))
  const [first, ...rest] = was.keys()
  expect([...now.keys()]).toEqual([first, 'Подход в одно касание', ...rest])
  for (const [name, old] of was) expect(now.get(name)!.slice(1, 4), name).toEqual(old.slice(1, 4))
  const decision = (name: string) => now.get(name)![4]
  for (const name of now.keys()) expect(decision(name), name).toMatch(/^(готово|наше отличие|позже|не делаем)( — .+)?$/)
  expect(decision('Подход в одно касание')).toBe('наше отличие')
  expect(now.get('Подход в одно касание')!.slice(1, 4)).toEqual(['нет', 'нет', 'нет'])
  for (const name of ['Чат тренера и подопечного', 'Таймер отдыха', 'Оплата и тарифы']) expect(decision(name), name).toMatch(/^(позже|не делаем) — /)
  expect(decision('Чат тренера и подопечного')).toContain('комментарии к тренировке')
  expect(parity.after).toContain('сегодня, 9 ноября')
  for (const word of ['готово', 'наше отличие', 'позже', 'не делаем']) expect(parity.after, word).toContain(`- **${word}** — `)

  // срез: сначала сквозной тест, потом страница, действие и список тренера; Playwright сам поднимает и гасит npm run dev
  expect(agent('ask-quick').prompt).toBe(
    'Подход в одно касание: на тренировке кнопка «Повторить подход» с весом и повторами прошлого подхода. У тренера в списке — последний подход каждого и «растёт / нет». Сначала сквозной тест',
  )
  expect(agent('ask-quick').steps).toEqual(['quick-e2e', 'quick-page', 'quick-action', 'quick-clients', 'quick-run'])
  expect(file('quick-e2e')).toMatchObject({ path: 'e2e/quick-set.spec.ts', before: null })
  expect(file('quick-page').path).toBe('app/workouts/[id]/page.tsx')
  expect(file('quick-page').after).toContain('Повторить подход')
  expect(file('quick-action').path).toBe('app/workouts/[id]/actions.ts')
  // повторяется подход с кнопки (его id), вес и повторы — из базы; список тренера — только его подопечные
  expect(file('quick-page').after).toContain('repeatSet.bind(null, id, last.id)')
  expect(file('quick-action').after).toContain('export async function repeatSet(workoutId: string, setId: string)')
  expect(file('quick-action').after).toContain('select workout_id, weight, reps from sets where id = $2 and workout_id = $1')
  expect(file('quick-clients').path).toBe('app/clients/page.tsx')
  expect(file('quick-clients').after).toContain('where c.coach_id = $1')
  expect(run('quick-run')).toMatchObject({ cmd: 'npx playwright test e2e/quick-set.spec.ts', code: 0 })
  expect(run('quick-run').out.join('\n')).toContain('1 passed')
  expect(commit('c-quick')).toMatchObject({ message: 'Подход в одно касание; последний подход у тренера', branch: 'main', parents: [commit('c-complaints').hash] })
  // в main нет файлов копии
  const paths = commit('c-quick').files.map((f) => f.path)
  expect(paths).toEqual(expect.arrayContaining(['docs/complaints.md', 'e2e/quick-set.spec.ts']))
  for (const path of ['app/chat/page.tsx', 'components/RestTimer.tsx', 'app/billing/page.tsx']) expect(paths, path).not.toContain(path)

  // одно касание: на «Ногах» на один подход «50 кг × 10» больше
  const BASE = 'http://localhost:3000'
  expect(browser('login-anna').urlAfter).toBe(`${BASE}/workouts`)
  const tap = browser('quick-tap')
  expect(tap.url).toBe(`${BASE}/workouts/1`)
  const fifties = (lines: string[]) => lines.filter((line) => line === '50 кг × 10').length
  expect(fifties(tap.before)).toBeGreaterThanOrEqual(3)
  expect(fifties(tap.after)).toBe(fifties(tap.before) + 1)
  expect(tap.network).toEqual([])
  // на кнопке — вес и повторы прошлого подхода, но не «50 кг × 10»: getByText("50 кг × 10") в e2e/cycle.spec.ts находит только подход
  expect(tap.buttons).toContain('Повторить подход (50 кг, 10 повторов)')
  expect(tap.buttons.filter((name) => name.includes('кг ×'))).toEqual([])
  // та же страница после касания, без нажатия: на подход больше, чем до касания, — для кадра с прокруткой (pageLines)
  const again = browser('quick-after')
  expect(again.url).toBe(`${BASE}/workouts/1`)
  expect(again.urlAfter).toBeUndefined()
  expect(again.before).toEqual(again.after)
  expect(fifties(again.before)).toBe(fifties(tap.before) + 1)
  expect(again.before).toEqual(tap.after)
  expect(again.buttons).toContain('Повторить подход (50 кг, 10 повторов)')
  // тренер видит у Анны последний подход «50 кг × 10»
  expect(browser('login-marina').urlAfter).toBe(`${BASE}/clients`)
  const list = browser('clients-last').after
  expect(list.some((line) => line.includes('50 кг × 10'))).toBe(true)
  expect(list[list.indexOf('Анна') + 2]).toBe('Последний подход: 50 кг × 10, Ноги')
  // рост — против прошлого подхода той же тренировки: Анна повторила 50 × 10 — не растёт; у Олега 55 × 8 после 50 × 10 — растёт
  expect(list[list.indexOf('Анна') + 3]).toMatch(/^Вес (не )?растёт$/)
  expect(list[list.indexOf('Анна') + 3]).toBe('Вес не растёт')
  expect(list.slice(list.indexOf('Олег') + 2, list.indexOf('Олег') + 4)).toEqual(['Последний подход: 55 кг × 8, Жим лёжа', 'Вес растёт'])
})

test('s19: проверки зелёные; индекс меняет план; копия без auth не восстанавливается, полная — да; backups не в git', () => {
  const events = sessions['s19-reliability'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['typegen', 'check-run', 'e2e-fix', 'e2e-all', 'c-e2e-fix'],
    ...['speed-file', 'speed-load', 'explain', 'ask-index', 'index-sql', 'index-apply', 'explain2'],
    ...['backup-ignore', 'dump-public', 'restore-try', 'restore-users', 'dump-all', 'restore-full', 'restore-count'],
    ...['restore-login', 'restore-path', 'restore-login2', 'restore-doc', 'c-reliability'],
  ])
  const run = (id: string) => find('s19-reliability', id, 'run')
  const file = (id: string) => find('s19-reliability', id, 'file')
  const agent = (id: string) => find('s19-reliability', id, 'agent')
  const commit = (id: string) => find('s19-reliability', id, 'commit')
  const at = (id: string) => events.findIndex((e) => e.id === id)
  // шаги внутри запроса — агента, остальные — человека
  const inner = new Set(agent('ask-index').steps)
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }

  // проверки: npm run check и оба сквозных теста — зелёные; до полного прогона — точная подпись «Дата» в cycle.spec.ts
  expect(run('typegen')).toMatchObject({ cmd: 'npx next typegen', code: 0 })
  expect(run('check-run')).toMatchObject({ cmd: 'npm run check', code: 0 })
  const fix = file('e2e-fix')
  expect(fix.path).toBe('e2e/cycle.spec.ts')
  expect(fix.before).toContain('getByLabel("Дата").fill')
  expect(fix.after).toContain('getByLabel("Дата", { exact: true }).fill')
  expect(at('e2e-fix')).toBeLessThan(at('e2e-all'))
  expect(run('e2e-all')).toMatchObject({ cmd: 'npx playwright test', code: 0 })
  const e2e = run('e2e-all').out.join('\n')
  for (const spec of ['cycle.spec.ts', 'quick-set.spec.ts']) expect(e2e, spec).toContain(spec)
  expect(e2e).toContain('2 passed')
  expect(commit('c-e2e-fix')).toMatchObject({ message: 'Сквозной тест: точная подпись «Дата»', branch: 'main', parents: [find('s18-quick-set', 'c-quick', 'commit').hash] })

  // скорость: 2000 тренировок Анны по 20 подходов; без индекса — перебор таблицы, с индексом — поиск по нему
  expect(file('speed-file')).toMatchObject({ path: 'supabase/seed-speed.sql', before: null })
  expect(file('speed-file').after).toContain('generate_series')
  expect(run('speed-load')).toMatchObject({ cmd: 'psql -f supabase/seed-speed.sql', code: 0 })
  expect(run('speed-load').out).toEqual(['INSERT 0 2000', 'INSERT 0 40000'])
  // повторный запуск ничего не добавит: обе вставки — только чего ещё нет
  expect(file('speed-file').after.match(/and not exists/g)).toHaveLength(2)
  const query = 'psql -c "explain analyze select weight, reps from sets where workout_id = 1500"'
  for (const id of ['explain', 'explain2']) expect(run(id), id).toMatchObject({ cmd: query, code: 0 })
  expect(run('explain').out.join('\n')).toContain('Seq Scan on sets')
  expect(agent('ask-index').prompt).toBe('Вот вывод EXPLAIN ANALYZE: Seq Scan on sets по workout_id. Добавь индекс миграцией, применяй с подтверждения')
  expect(agent('ask-index').steps).toEqual(['index-sql', 'index-apply'])
  expect(file('index-sql')).toMatchObject({ path: 'supabase/migrations/0009_sets_workout_index.sql', before: null })
  expect(file('index-sql').after).toContain('create index sets_workout_id_idx on sets (workout_id);')
  expect(run('index-apply')).toMatchObject({ cmd: 'psql -f supabase/migrations/0009_sets_workout_index.sql', code: 0, out: ['CREATE INDEX'] })
  const plan2 = run('explain2').out.join('\n')
  expect(plan2).toContain('Index Scan')
  expect(plan2).toContain('sets_workout_id_idx')
  expect(plan2).not.toContain('Seq Scan')

  // копия только public: auth в неё не входит — pg_restore с ошибками, пользователей в копии нет
  expect(file('backup-ignore').path).toBe('.gitignore')
  expect(file('backup-ignore').after).toContain('/backups/\n')
  expect(at('backup-ignore')).toBeLessThan(at('dump-public'))
  expect(run('dump-public')).toMatchObject({ cmd: 'mkdir -p backups && pg_dump -n public -Fc -f backups/trainer.dump', code: 0 })
  expect(run('restore-try').cmd).toBe('createdb restore_check && pg_restore -d restore_check backups/trainer.dump')
  expect(run('restore-try').code).not.toBe(0)
  const tried = [...run('restore-try').out, ...run('restore-users').out].join('\n')
  expect(tried).toContain('auth')
  expect(run('restore-try').out.join('\n')).toContain('schema "auth" does not exist')
  expect(run('restore-users').cmd).toBe('psql -d restore_check -c "select count(*) from auth.users"')
  expect(run('restore-users').out.join('\n')).toContain('relation "auth.users" does not exist')

  // копия всей базы восстанавливается: подходов в рабочей базе и в копии поровну
  expect(run('dump-all')).toMatchObject({ cmd: 'pg_dump -Fc -f backups/trainer-full.dump', code: 0 })
  expect(run('restore-full')).toMatchObject({ cmd: 'createdb restore_full && pg_restore -d restore_full backups/trainer-full.dump', code: 0 })
  expect(run('restore-count').code).toBe(0)
  const counts = run('restore-count').out.filter(Boolean)
  expect(counts).toHaveLength(2)
  expect(counts[0]).toMatch(/^\d+$/)
  expect(counts[1]).toBe(counts[0])
  expect(Number(counts[0])).toBeGreaterThanOrEqual(40000)

  // учения до входа: проверка пароля, как в app/api/login (crypt() без схемы), на копии падает — search_path базы в копию не перешёл
  const login = `select count(*) from auth.users where email = 'anna@example.com' and encrypted_password = crypt('demo-password', encrypted_password)`
  expect(run('restore-login').cmd).toBe(`psql -At -d restore_full -c "${login}"`)
  expect(run('restore-login').code).not.toBe(0)
  expect(run('restore-login').out.join('\n')).toMatch(/function crypt\(.*\) does not exist/)
  // тот же search_path, что задаёт рабочей базе слой Supabase
  const path = 'set search_path to "$user", public, extensions'
  expect(readFileSync(join(COURSE, 'scripts/session/supabase-local.sql'), 'utf8')).toContain(path)
  expect(run('restore-path')).toMatchObject({ cmd: `psql -c 'alter database restore_full ${path}'`, code: 0, out: ['ALTER DATABASE'] })
  // пользователей в рабочей базе и в копии поровну, пароль на копии подходит
  const login2 = run('restore-login2')
  expect(login2.cmd).toBe(`psql -At -c "select count(*) from auth.users" && psql -At -d restore_full -c "select count(*) from auth.users" -c "${login}"`)
  expect(login2.code).toBe(0)
  const users = login2.out.filter(Boolean)
  expect(users).toHaveLength(3)
  expect(users[0]).toMatch(/^\d+$/)
  expect(users[1]).toBe(users[0])
  expect(users[2]).toBe('1')
  expect(at('restore-count')).toBeLessThan(at('restore-login'))
  expect(at('restore-login2')).toBeLessThan(at('restore-doc'))

  // учения записаны по записи: шаги, что сверять (подходы, пользователи, вход), где лежит копия, журнал
  const doc = file('restore-doc')
  expect(doc).toMatchObject({ path: 'docs/restore.md', before: null })
  for (const word of ['mkdir -p backups && pg_dump -Fc -f backups/trainer-full.dump', 'pg_restore', 'count(*) from sets', 'count(*) from auth.users', 'Вход']) {
    expect(doc.after, word).toContain(word)
  }
  // что показали шаги: таблицы invites в копии public нет, число ошибок — из записи, crypt() и search_path — как в командах
  expect(doc.after).toContain('invites')
  const errors = run('restore-try').out.join('\n').match(/errors ignored on restore: (\d+)/)![1]
  expect(doc.after).toContain(`${errors} ошибки`)
  expect(doc.after).toContain(login)
  expect(doc.after).toContain('function crypt(unknown, text) does not exist')
  expect(run('restore-login').out.join('\n')).toContain('function crypt(unknown, text) does not exist')
  expect(doc.after).toContain(run('restore-path').cmd)
  expect(doc.after).not.toMatch(/Анн/)
  expect(commit('c-reliability')).toMatchObject({ message: 'Индекс подходов; учения по восстановлению', branch: 'main', parents: [commit('c-e2e-fix').hash] })
  expect(commit('c-reliability').files.map((f) => f.path)).toEqual(
    expect.arrayContaining(['.gitignore', 'docs/restore.md', 'supabase/seed-speed.sql', 'supabase/migrations/0009_sets_workout_index.sql']),
  )

  // копии базы — ни в одном коммите сессии и ни в одном изменении команд
  for (const e of events) {
    if (e.kind === 'commit') expect(e.files.filter((f) => f.path.startsWith('backups/')), e.id).toEqual([])
    if (e.kind === 'run') expect((e.files ?? []).filter((f) => f.path.startsWith('backups/')), e.id).toEqual([])
  }
})

test('s20: новичок без шага → пустой экран в три части; меню и выход; axe — красный, после токенов — зелёный', () => {
  const events = sessions['s20-first-run'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['typegen', 'e2e-wait', 'c-e2e-wait', 'dev', 'login-marina', 'invite-vera', 'vera-join'],
    ...['natasha-file', 'natasha-apply', 'login-natasha', 'natasha-empty', 'ask-path', 'p-clients', 'p-workouts', 'p-layout', 'p-report'],
    ...['ask-first', 'first-e2e', 'first-red', 'ask-first-go', 'first-nav', 'first-layout', 'first-logout', 'first-login'],
    ...['first-clients', 'first-workouts', 'first-report', 'first-green', 'c-first'],
    ...['natasha-hint', 'natasha-logout', 'login-vera', 'vera-hint', 'a11y-install', 'ask-a11y', 'a11y-e2e', 'a11y-red'],
    ...['ask-contrast', 'contrast-css', 'contrast-restart', 'a11y-green', 'design-dark', 'c-a11y'],
  ])
  const run = (id: string) => find('s20-first-run', id, 'run')
  const file = (id: string) => find('s20-first-run', id, 'file')
  const read = (id: string) => find('s20-first-run', id, 'read')
  const agent = (id: string) => find('s20-first-run', id, 'agent')
  const browser = (id: string) => find('s20-first-run', id, 'browser')
  const commit = (id: string) => find('s20-first-run', id, 'commit')
  const at = (id: string) => events.findIndex((e) => e.id === id)
  // шаги внутри запросов — агента, остальные — человека: правка теста, файл тренера, psql, браузер, npm install
  const inner = new Set(['ask-path', 'ask-first', 'ask-first-go', 'ask-a11y', 'ask-contrast'].flatMap((id) => agent(id).steps))
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }
  const BASE = 'http://localhost:3000'

  // подготовка: типы маршрутов и сквозной тест s18, который ждёт входа явно — 15 с вместо 5 по умолчанию
  expect(run('typegen')).toMatchObject({ cmd: 'npx next typegen', code: 0 })
  const wait = file('e2e-wait')
  expect(wait.path).toBe('e2e/quick-set.spec.ts')
  expect(wait.before).toContain('await expect(page).toHaveURL(home);')
  expect(wait.after).toContain('await expect(page).toHaveURL(home, { timeout: 15_000 });')
  expect(commit('c-e2e-wait')).toMatchObject({ message: 'Сквозной тест ждёт вход', branch: 'main', parents: [find('s19-reliability', 'c-reliability', 'commit').hash] })

  // первый экран нового подопечного: Вера по приглашению Марины — «Тренировок пока нет», и дальше ни слова
  expect(browser('login-marina').urlAfter).toBe(`${BASE}/clients`)
  const link = browser('invite-vera').after.join('\n').match(/\/join\/[0-9a-f]{32}/)![0]
  const joined = browser('vera-join')
  expect(joined.url).toBe(`${BASE}${link}`)
  expect(joined.fields).toEqual([
    { label: 'Имя', value: 'Вера' },
    { label: 'Почта', value: 'vera@example.com' },
    { label: 'Пароль', value: 'demo-password' },
  ])
  expect(joined.urlAfter).toBe(`${BASE}/workouts`)
  expect(joined.after).toContain('Тренировок пока нет')
  expect(joined.after).toEqual(['Мои тренировки', 'Тренировок пока нет'])

  // новый тренер — файл автора по образцу seed.sql: пароль только хешем, профиль тренера
  const coach = file('natasha-file')
  expect(coach).toMatchObject({ path: 'supabase/tests/new-coach.sql', before: null })
  for (const part of ["'natasha@example.com'", "crypt('demo-password', gen_salt('bf'))", "'coach', 'Наташа'"]) expect(coach.after, part).toContain(part)
  expect(run('natasha-apply')).toMatchObject({ cmd: 'psql -f supabase/tests/new-coach.sql', code: 0, out: ['INSERT 0 1', 'INSERT 0 1'] })
  expect(browser('login-natasha').urlAfter).toBe(`${BASE}/clients`)
  // пустой список без слова: заголовок, сразу форма «Имя / Добавить», потом «Приглашений пока нет»
  const empty = browser('natasha-empty')
  expect(empty.url).toBe(`${BASE}/clients`)
  expect(empty.after.join('\n')).not.toContain('Подопечных пока нет')
  expect(empty.after.slice(0, 2)).toEqual(['Подопечные', 'Имя'])
  expect(empty.after).toContain('Приглашений пока нет')
  expect(empty.buttons).toEqual(['Добавить', 'Создать приглашение'])

  // путь новичка в Plan: только чтение четырёх страниц
  expect(agent('ask-path').prompt).toBe('Пройди путь нового тренера и нового подопечного: что они видят первым, где пусто и куда идти дальше. Код не меняй')
  expect(agent('ask-path').steps).toEqual(['p-clients', 'p-workouts', 'p-layout', 'p-report'])
  expect(['p-clients', 'p-workouts', 'p-layout', 'p-report'].map((id) => read(id).path)).toEqual([
    'app/clients/page.tsx',
    'app/workouts/page.tsx',
    'app/layout.tsx',
    'app/report/page.tsx',
  ])
  expect(read('p-report').text).toContain('Месяц — в адресе: /report?month=2026-10')
  for (const word of ['Меню', 'выхода', '«Программы»', '«Отчёт»', 'без входа', '/report']) expect(agent('ask-path').reply, word).toContain(word)

  // первый экран: сначала сквозной тест — красный; вторым ходом («Делай») меню, выход и пустые экраны — зелёный
  expect(agent('ask-first').prompt).toBe(
    'Сделай первый экран: меню по роли с выходом, пустые экраны в три части — что здесь будет, что сделать, кнопка. Сначала сквозной тест',
  )
  expect(agent('ask-first').steps).toEqual(['first-e2e', 'first-red'])
  expect(agent('ask-first-go').prompt).toBe('Делай')
  expect(agent('ask-first-go').steps).toEqual([
    ...['first-nav', 'first-layout', 'first-logout', 'first-login'],
    ...['first-clients', 'first-workouts', 'first-report', 'first-green'],
  ])
  const e2e = file('first-e2e')
  expect(e2e).toMatchObject({ path: 'e2e/first-run.spec.ts', before: null })
  for (const part of ['natasha@example.com', 'vera@example.com', 'Подопечных пока нет', 'Создать приглашение', 'назначит тренер', 'Выйти']) expect(e2e.after, part).toContain(part)
  // выход проверен: после «Выйти» меню нет, а страница тренера снова ведёт на вход
  expect(e2e.after).toContain('await expect(page.getByRole("navigation", { name: "Меню" })).toHaveCount(0);')
  expect(e2e.after).toContain('await page.goto("/clients");')
  const spec = 'npx playwright test e2e/first-run.spec.ts'
  expect(run('first-red').cmd).toBe(spec)
  expect(run('first-red').code).not.toBe(0)
  expect(run('first-red').out.join('\n')).toContain('2 failed')
  expect(file('first-nav')).toMatchObject({ path: 'components/Nav.tsx', before: null })
  for (const label of ['Подопечные', 'Программы', 'Отчёт', 'Мои тренировки', 'Выйти', 'aria-label="Меню"']) expect(file('first-nav').after, label).toContain(label)
  expect(file('first-layout').path).toBe('app/layout.tsx')
  expect(file('first-layout').after).toContain('<Nav />')
  expect(file('first-layout').after).toContain('<Suspense>')
  expect(file('first-logout')).toMatchObject({ path: 'app/api/logout/route.ts', before: null })
  expect(file('first-logout').after).toContain('.delete("session")')
  expect(file('first-logout').after).toContain('status: 303')
  // после входа меню в общем layout — только с сервера: вход обновляет страницу
  expect(file('first-login').path).toBe('app/login/page.tsx')
  expect(file('first-login').after).toContain('router.refresh();')
  // пустые экраны в три части; подопечный по имени — «без входа» и с подписью
  const clients = file('first-clients')
  expect(clients.path).toBe('app/clients/page.tsx')
  for (const part of ['Подопечных пока нет', 'Здесь будут', 'Создайте приглашение', 'Добавить без входа', 'Войти в приложение такой подопечный не сможет']) {
    expect(clients.after, part).toContain(part)
  }
  // пустой экран вместо списка, а не над пустым <ul>
  expect(clients.after).toContain('{clients.length === 0 ? (')
  expect(file('first-workouts').path).toBe('app/workouts/page.tsx')
  expect(file('first-workouts').after).toContain('Первую тренировку назначит тренер')
  // отчёт без месяца — месяцы из базы, без настоящих часов
  const report = file('first-report')
  expect(report.path).toBe('app/report/page.tsx')
  expect(report.before).toContain('Месяц — в адресе: /report?month=2026-10')
  expect(report.after).not.toContain('Месяц — в адресе')
  expect(report.after).toContain("select distinct to_char(w.day, 'YYYY-MM') as month")
  expect(report.after).not.toMatch(/new Date\(\)|Date\.now\(\)/)
  expect(run('first-green')).toMatchObject({ cmd: spec, code: 0 })
  expect(run('first-green').out.join('\n')).toContain('2 passed')
  expect(commit('c-first')).toMatchObject({ message: 'Первый экран: меню, выход, пустые экраны с шагом', branch: 'main', parents: [commit('c-e2e-wait').hash] })
  expect(commit('c-first').files.map((f) => f.path)).toEqual(
    expect.arrayContaining(['components/Nav.tsx', 'app/api/logout/route.ts', 'e2e/first-run.spec.ts', 'supabase/tests/new-coach.sql']),
  )

  // после правок: у Наташи пустой экран в три части и меню, у Веры — что тренировку назначит тренер
  const hint = browser('natasha-hint')
  expect(hint.url).toBe(`${BASE}/clients`)
  expect(hint.after).toContain('Подопечных пока нет')
  expect(hint.after).toContain('Создать приглашение')
  expect(hint.after.slice(0, 5)).toEqual(['Подопечные', 'Программы', 'Отчёт', 'Выйти', 'Подопечные'])
  expect(hint.buttons.filter((name) => name === 'Создать приглашение')).toHaveLength(1)
  expect(hint.buttons).toContain('Добавить без входа')
  // Наташа выходит из меню: на /login меню уже нет, и Вера входит без чужого меню над формой
  const logout = browser('natasha-logout')
  expect(logout.url).toBe(`${BASE}/clients`)
  expect(logout.urlAfter).toBe(`${BASE}/login`)
  expect(logout.after).toContain('Вход')
  for (const word of ['Выйти', 'Подопечные', 'Программы']) expect(logout.after, word).not.toContain(word)
  expect(browser('login-vera').buttons).toEqual(['Войти'])
  expect(browser('login-vera').urlAfter).toBe(`${BASE}/workouts`)
  const vera = browser('vera-hint')
  expect(vera.url).toBe(`${BASE}/workouts`)
  expect(vera.after).toContain('Выйти')
  expect(vera.after.slice(0, 4)).toEqual(['Мои тренировки', 'Выйти', 'Мои тренировки', 'Тренировок пока нет'])
  expect(vera.after.some((line) => line.includes('Первую тренировку назначит тренер'))).toBe(true)

  // axe — новая зависимость разработки, только командой npm; package.json — из состояния сессии, его хеш — тот, что записала команда
  const install = run('a11y-install')
  expect(install).toMatchObject({ cmd: 'npm install -D @axe-core/playwright', code: 0 })
  const pkgBlob = install.files?.find((f) => f.path === 'package.json')?.blob
  expect(install.files?.map((f) => f.path)).toEqual(expect.arrayContaining(['package.json', 'package-lock.json']))
  const state = join(COURSE, '../demo-app/state/s20-first-run.tar.gz')
  const pkgText = execFileSync('tar', ['-xzOf', state, 'package.json'], { encoding: 'utf8' })
  expect(gitBlobHash(pkgText)).toBe(pkgBlob)
  expect(JSON.parse(pkgText).devDependencies).toHaveProperty('@axe-core/playwright')

  // доступность: axe по WCAG 2 A и AA в обеих схемах и вход одной клавиатурой — красный только тёмной схемой, правило color-contrast
  expect(agent('ask-a11y').prompt).toBe(
    'Проверь доступность: axe на входе, у тренера и у подопечного в светлой и тёмной схеме, и вход одной клавиатурой. Сначала тест, код не меняй',
  )
  expect(agent('ask-a11y').steps).toEqual(['a11y-e2e', 'a11y-red'])
  const a11y = file('a11y-e2e')
  expect(a11y).toMatchObject({ path: 'e2e/a11y.spec.ts', before: null })
  for (const part of ['@axe-core/playwright', '"wcag2a", "wcag2aa"', 'colorScheme', '"light", "dark"', '"/login"', 'keyboard.press("Tab")', 'keyboard.press("Enter")']) {
    expect(a11y.after, part).toContain(part)
  }
  // axe — после меню: оно приходит с router.refresh() после входа
  for (const part of ['await expect(page).toHaveURL(home, { timeout: 15_000 });\n  // меню', 'name: "Меню" })).toBeVisible();']) {
    expect(a11y.after, part).toContain(part)
  }
  const a11ySpec = 'npx playwright test e2e/a11y.spec.ts'
  const red = run('a11y-red')
  expect(red.cmd).toBe(a11ySpec)
  expect(red.code).not.toBe(0)
  expect(red.out.join('\n')).toContain('color-contrast')
  const failed = red.out.filter((line) => /^\s+✘/.test(line))
  expect(failed.length).toBeGreaterThan(0)
  for (const line of failed) expect(line).toContain('тёмная схема')
  expect(red.out.some((line) => /^\s+✓/.test(line) && line.includes('клавиатурой'))).toBe(true)
  expect(at('a11y-install')).toBeLessThan(at('a11y-red'))
  for (const word of ['color-contrast', 'тёмной схеме']) expect(agent('ask-a11y').reply, word).toContain(word)

  // контраст — токеном тёмной схемы в globals.css; dev-сервер перезапускается со сбросом кэша, и тот же тест зелёный
  expect(agent('ask-contrast').prompt).toBe('Исправь контраст в тёмной схеме токенами в globals.css, остальное не трогай')
  expect(agent('ask-contrast').steps).toEqual(['contrast-css', 'contrast-restart', 'a11y-green'])
  const css = file('contrast-css')
  expect(css.path).toBe('app/globals.css')
  const dark = css.after.slice(css.after.indexOf('@media (prefers-color-scheme: dark)'))
  expect(dark).toContain('--color-zinc-500: #a1a1aa;')
  expect(css.before).not.toContain('--color-zinc-500')
  expect(run('contrast-restart')).toMatchObject({
    cmd: "curl -fsS -X POST 'localhost:3000/__nextjs_restart_dev?invalidateFileSystemCache=1' && sleep 2 && until curl -fs -o /dev/null localhost:3000/login; do sleep 1; done",
    code: 0,
  })
  expect(run('a11y-green')).toMatchObject({ cmd: a11ySpec, code: 0 })
  expect(run('a11y-green').out.join('\n')).toContain('7 passed')
  // правила оформления — по коду: человек называет токен тёмной темы в docs/design.md
  const design = file('design-dark')
  expect(design.path).toBe('docs/design.md')
  expect(design.after).toContain('в тёмной теме `#a1a1aa`')
  expect(design.after).toContain('`--color-zinc-500`')
  expect(commit('c-a11y')).toMatchObject({ message: 'Доступность: axe и клавиатура, контраст тёмной схемы', branch: 'main', parents: [commit('c-first').hash] })
  expect(commit('c-a11y').files.find((f) => f.path === 'package.json')?.blob).toBe(pkgBlob)
  expect(commit('c-a11y').files.map((f) => f.path)).toEqual(expect.arrayContaining(['e2e/a11y.spec.ts', 'app/globals.css', 'docs/design.md']))
})

test('s21: тесты расчёта до кода; два итога за день расходятся, после одной функции — совпадают; чужой не видит дневник', () => {
  const events = sessions['s21-nutrition'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['typegen', 'nutrition-doc', 'c-nutrition-doc', 'ask-schema', 'n-sql', 'n-apply', 'n-test', 'n-run'],
    ...['ask-calc', 'calc-test', 'calc-red', 'calc-code', 'calc-green', 'c-calc'],
    ...['ask-pages', 'pages-lib', 'pages-anna', 'pages-actions', 'pages-coach', 'pages-goals', 'pages-nav', 'pages-e2e', 'c-pages'],
    ...['dev', 'login-marina', 'goals-set', 'marina-logout', 'login-anna', 'food-1', 'food-2', 'food-3', 'anna-day'],
    ...['anna-logout', 'login-marina2', 'coach-day', 'ask-one', 'one-test', 'one-red', 'one-code', 'one-green', 'c-one'],
    ...['marina-logout2', 'login-anna2', 'anna-day2'],
  ])
  const run = (id: string) => find('s21-nutrition', id, 'run')
  const file = (id: string) => find('s21-nutrition', id, 'file')
  const agent = (id: string) => find('s21-nutrition', id, 'agent')
  const browser = (id: string) => find('s21-nutrition', id, 'browser')
  const commit = (id: string) => find('s21-nutrition', id, 'commit')
  const at = (id: string) => events.findIndex((e) => e.id === id)
  // шаги внутри запросов — агента, остальные — человека: правила словами, браузер, коммиты
  const inner = new Set(['ask-schema', 'ask-calc', 'ask-pages', 'ask-one'].flatMap((id) => agent(id).steps))
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }
  const BASE = 'http://localhost:3000'
  expect(run('typegen')).toMatchObject({ cmd: 'npx next typegen', code: 0 })

  // правила словами — пишет человек, до схемы и кода
  const doc = file('nutrition-doc')
  expect(doc).toMatchObject({ path: 'docs/nutrition.md', before: null })
  for (const rule of ['на 100 г', 'значение × граммы / 100', 'Число без единицы не пишем', 'Больше 900 ккал на 100 г', '«это кДж?»', 'одна функция', 'Округление один раз, при показе', 'ккал, белки, жиры, углеводы', 'Неделя — с понедельника', '30 февраля']) {
    expect(doc.after, rule).toContain(rule)
  }
  expect(doc.after.trimEnd().split('\n').at(-1)).toBe('Это решения нашего приложения.')
  expect(commit('c-nutrition-doc')).toMatchObject({ message: 'Питание: правила словами', branch: 'main', parents: [find('s20-first-run', 'c-a11y', 'commit').hash] })
  expect(commit('c-nutrition-doc').files.map((f) => f.path)).toContain('docs/nutrition.md')

  // схема с RLS сразу, миграция — с подтверждения; тест с базой: Анна пишет своё, Марина видит, Света не видит
  expect(agent('ask-schema').prompt).toBe(
    'Сделай схему питания по docs/nutrition.md: цели тренера и дневник подопечного, RLS сразу. Миграцию применяй с моего подтверждения',
  )
  expect(agent('ask-schema').steps).toEqual(['n-sql', 'n-apply', 'n-test', 'n-run'])
  const sql = file('n-sql')
  expect(sql).toMatchObject({ path: 'supabase/migrations/0010_nutrition.sql', before: null })
  for (const part of ['create table nutrition_goals', 'create table food_entries', 'day date not null', 'grams numeric', 'kcal int not null check (kcal between 1 and 10000)', 'alter table nutrition_goals enable row level security', 'alter table food_entries enable row level security']) {
    expect(sql.after, part).toContain(part)
  }
  expect(sql.after.match(/create policy/g)).toHaveLength(4)
  expect(run('n-apply')).toMatchObject({ cmd: 'psql -f supabase/migrations/0010_nutrition.sql', code: 0 })
  expect(run('n-apply').out).toEqual([...Array(2).fill('CREATE TABLE'), ...Array(2).fill('ALTER TABLE'), ...Array(4).fill('CREATE POLICY')])
  const dbTest = file('n-test')
  expect(dbTest).toMatchObject({ path: 'test/nutrition.test.ts', before: null })
  for (const part of ['Анна пишет в свой дневник', 'Марина, тренер Анны, видит её дневник', 'Света, подопечная Игоря, не видит дневник Анны', 'row-level security']) {
    expect(dbTest.after, part).toContain(part)
  }
  expect(run('n-run')).toMatchObject({ cmd: 'npx vitest run test/nutrition.test.ts', code: 0 })
  expect(run('n-run').out.join('\n')).toMatch(/Tests\s+4 passed \(4\)/)

  // расчёт: сначала тесты (красные — модуля нет), потом код — зелёные
  expect(agent('ask-calc').prompt).toBe('Расчёт по правилам: сначала тесты, потом код')
  expect(agent('ask-calc').steps).toEqual(['calc-test', 'calc-red', 'calc-code', 'calc-green'])
  const calcTest = file('calc-test')
  expect(calcTest).toMatchObject({ path: 'lib/nutrition.test.ts', before: null })
  for (const part of ['expect(portion(350, 60)).toBe(210);', 'checkPer100(1464)', 'это кДж?', 'parseAmount("52,5")).toBe(52.5)', 'expect(isDay("2026-02-30")).toBe(false);', 'expect(dayTotal(DAY)).toBeCloseTo(510.8);']) {
    expect(calcTest.after, part).toContain(part)
  }
  const unit = 'npx vitest run lib/nutrition.test.ts'
  expect(run('calc-red').cmd).toBe(unit)
  expect(run('calc-red').code).not.toBe(0)
  // красный потому, что модуля ещё нет, а не по другой причине
  expect(run('calc-red').out.join('\n')).toContain("Error: Cannot find module './nutrition' imported from ~/trainer-app/lib/nutrition.test.ts")
  const lib = file('calc-code')
  expect(lib).toMatchObject({ path: 'lib/nutrition.ts', before: null })
  for (const signature of ['export function portion(per100: number, grams: number): number', 'export function checkPer100(kcal: number): string | null', 'export function isDay(text: string): boolean', 'export function dayTotal(']) {
    expect(lib.after, signature).toContain(signature)
  }
  expect(run('calc-green')).toMatchObject({ cmd: unit, code: 0 })
  expect(run('calc-green').out.join('\n')).toMatch(/Tests\s+5 passed \(5\)/)
  expect(at('calc-test')).toBeLessThan(at('calc-red'))
  expect(at('calc-red')).toBeLessThan(at('calc-code'))
  expect(commit('c-calc')).toMatchObject({ message: 'Питание: схема, RLS, расчёт порции', branch: 'main', parents: [commit('c-nutrition-doc').hash] })
  expect(commit('c-calc').files.map((f) => f.path)).toEqual(
    expect.arrayContaining(['supabase/migrations/0010_nutrition.sql', 'test/nutrition.test.ts', 'lib/nutrition.test.ts', 'lib/nutrition.ts']),
  )

  // страницы: день и неделя — в адресе, настоящих часов нет; «Итого» у подопечного — сумма уже округлённых строк, у тренера — dayTotal
  expect(agent('ask-pages').prompt).toBe('Страницы: дневник подопечного за день и цели со сводкой у тренера на карточке. День и неделя — в адресе')
  const pageSteps = ['pages-lib', 'pages-anna', 'pages-actions', 'pages-coach', 'pages-goals', 'pages-nav', 'pages-e2e']
  expect(agent('ask-pages').steps).toEqual(pageSteps)
  expect(pageSteps.map((id) => file(id).path)).toEqual([
    'lib/nutrition.ts',
    'app/nutrition/page.tsx',
    'app/nutrition/actions.ts',
    'app/clients/[id]/page.tsx',
    'app/clients/[id]/actions.ts',
    'components/Nav.tsx',
    'e2e/first-run.spec.ts',
  ])
  expect(file('pages-lib').after).toContain('return { kcal, total: kcal.reduce((sum, value) => sum + value, 0) };')
  expect(file('pages-lib').after).toContain('const total = (value: Value) => Math.round(dayTotal(entries, value));')
  expect(file('pages-anna').after).toContain('const lines = dayLines(data.entries);')
  expect(file('pages-coach').after).toContain('const sum = daySummary(entries);')
  expect(file('pages-coach').after).toContain('{goals && ` из ${goals.kcal} ккал`}')
  // день из адреса — isDay: «2026-02-30» не дойдёт до базы
  for (const id of ['pages-anna', 'pages-actions', 'pages-coach']) expect(file(id).after, id).toMatch(/isDay\((day|week)\)/)
  expect(file('pages-nav').after).toContain('["/nutrition", "Питание"]')
  expect(file('pages-e2e').after).toContain('toHaveText(["Мои тренировки", "Питание"])')
  for (const id of [...pageSteps, 'one-code']) expect(file(id).after, id).not.toMatch(/new Date\(\)|Date\.now\(\)/)
  expect(commit('c-pages')).toMatchObject({ message: 'Питание: дневник и сводка', branch: 'main', parents: [commit('c-calc').hash] })

  // цели Марины на карточке Анны; перед входом другого человека прежний выходит через меню
  expect(run('dev')).toMatchObject({ cmd: 'npm run dev', code: null })
  expect(browser('login-marina').urlAfter).toBe(`${BASE}/clients`)
  const goals = browser('goals-set')
  expect(goals.url).toBe(`${BASE}/clients/1`)
  expect(goals.urlAfter).toBeUndefined()
  expect(goals.fields).toEqual([
    { label: 'Ккал', value: '1800' },
    { label: 'Белки, г', value: '120' },
    { label: 'Жиры, г', value: '60' },
    { label: 'Углеводы, г', value: '200' },
  ])
  expect(goals.after).toContain('Цель на день: 1800 ккал, белки 120 г, жиры 60 г, углеводы 200 г')
  for (const [out, next] of [['marina-logout', 'login-anna'], ['anna-logout', 'login-marina2'], ['marina-logout2', 'login-anna2']]) {
    expect(browser(out).urlAfter, out).toBe(`${BASE}/login`)
    expect(browser(out).after, out).toEqual(['Вход', 'Почта', 'Пароль', 'Войти'])
    expect(at(out) + 1, out).toBe(at(next))
    // над формой входа — без чужого меню
    expect(browser(next).buttons, next).toEqual(['Войти'])
  }

  // дневник Анны за 12 ноября — день в адресе; три продукта с числами с этикеток, «12,3» — с запятой, как на этикетке
  expect(browser('login-anna').urlAfter).toBe(`${BASE}/workouts`)
  const DAY = `${BASE}/nutrition?day=2026-11-12`
  for (const id of ['food-1', 'food-2', 'food-3']) {
    const food = browser(id)
    expect(food.url, id).toBe(DAY)
    expect(food.urlAfter, id).toBeUndefined()
    expect(food.fields.map((f) => f.label), id).toEqual(['Продукт', 'Порция, г', 'Ккал', 'Белки, г', 'Жиры, г', 'Углеводы, г'])
  }
  expect(browser('food-1').fields.find((f) => f.label === 'Белки, г')?.value).toBe('12,3')

  // один день — два итога: у Анны «Итого» — сумма округлённых строк, у Марины — dayTotal и одно округление, на 1 ккал больше
  const kcalOf = (lines: string[], re: RegExp) => Number(lines.join('\n').match(re)![1])
  const anna = browser('anna-day')
  expect(anna.url).toBe(DAY)
  expect(anna.after).toContain('12 ноября')
  const shownLines = anna.after.filter((line) => /^.+, \d+ г — \d+ ккал$/.test(line))
  expect(shownLines).toHaveLength(3)
  const annaTotal = kcalOf(anna.after, /^Итого: (\d+) ккал$/m)
  expect(annaTotal).toBe(shownLines.reduce((sum, line) => sum + Number(line.match(/(\d+) ккал$/)![1]), 0))
  expect(browser('login-marina2').urlAfter).toBe(`${BASE}/clients`)
  const coach = browser('coach-day')
  expect(coach.url).toBe(`${BASE}/clients/1?week=2026-11-09`)
  expect(coach.after.join('\n')).toContain('12 ноября')
  expect(coach.after).toContain('Неделя с 9 ноября')
  // у каждого числа — единица, и у цели тоже
  const coachTotal = kcalOf(coach.after, /^12 ноября: (\d+) ккал из 1800 ккал$/m)
  expect(coachTotal - annaTotal).toBe(1)
  expect(coach.after).toContain('белки 21 г из 120 г, жиры 10 г из 60 г, углеводы 83 г из 200 г')

  // одна функция и одно округление для обоих экранов: сначала тест — красный на самом расхождении, потом код — зелёный
  expect(agent('ask-one').prompt).toBe('У подопечной и у тренера за один день разные итоги. Одна функция и одно округление для обоих экранов, сначала тест')
  expect(agent('ask-one').steps).toEqual(['one-test', 'one-red', 'one-code', 'one-green'])
  expect(file('one-test').path).toBe('lib/nutrition.test.ts')
  expect(file('one-test').after).toContain('expect(dayLines(DAY).total).toBe(daySummary(DAY).kcal);')
  expect(run('one-red').cmd).toBe(unit)
  expect(run('one-red').code).not.toBe(0)
  // ожидали итог сводки, получили итог экрана — те же числа, что в кадрах браузера
  expect(run('one-red').out).toContain(`AssertionError: expected ${annaTotal} to be ${coachTotal} // Object.is equality`)
  expect(file('one-code').path).toBe('lib/nutrition.ts')
  expect(file('one-code').before).toBe(file('pages-lib').after)
  expect(file('one-code').after).toContain('return { kcal, total: daySummary(entries).kcal };')
  expect(file('one-code').after).not.toContain('kcal.reduce')
  expect(run('one-green')).toMatchObject({ cmd: unit, code: 0 })
  expect(run('one-green').out.join('\n')).toMatch(/Tests\s+6 passed \(6\)/)
  expect(commit('c-one')).toMatchObject({ message: 'Один итог дня на двоих', branch: 'main', parents: [commit('c-pages').hash] })
  expect(commit('c-one').files.map((f) => f.path)).toEqual(expect.arrayContaining(['lib/nutrition.ts', 'lib/nutrition.test.ts']))

  // после одной функции у Анны тот же итог, что в сводке Марины
  expect(browser('login-anna2').urlAfter).toBe(`${BASE}/workouts`)
  const anna2 = browser('anna-day2')
  expect(anna2.url).toBe(DAY)
  expect(kcalOf(anna2.after, /^Итого: (\d+) ккал$/m)).toBe(coachTotal)
})

test('s22: фото в public открывается без входа и просится в git; после — только своим, удаление с файлом; файлов людей нет в коммитах', () => {
  const events = sessions['s22-progress'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['typegen', 'ask-measure', 'm-sql', 'm-apply', 'm-page', 'm-actions', 'm-coach', 'm-test', 'm-run', 'm-nav', 'm-e2e', 'c-measure'],
    ...['m-data-file', 'm-data-apply', 'ask-photos', 'ph-sql', 'ph-apply', 'ph-route', 'ph-page', 'ph-coach', 'c-photos'],
    ...['dev', 'login-anna', 'anna-measure', 'photo-make', 'anna-curl', 'photo-upload', 'photo-open', 'photo-git'],
    ...['ask-private', 'pr-test', 'pr-vitest', 'pr-red'],
    ...['ask-private-go', 'pr-lib', 'pr-store', 'pr-get', 'pr-page', 'pr-coach', 'pr-ignore', 'pr-clean', 'pr-green'],
    ...['c-private', 'photo-upload2', 'photo-git2', 'photo-anon', 'sveta-curl', 'photo-sveta', 'marina-curl', 'photo-marina', 'photo-old'],
    ...['anna-logout', 'login-marina', 'coach-measure', 'photo-del', 'photo-ls'],
  ])
  const run = (id: string) => find('s22-progress', id, 'run')
  const file = (id: string) => find('s22-progress', id, 'file')
  const agent = (id: string) => find('s22-progress', id, 'agent')
  const browser = (id: string) => find('s22-progress', id, 'browser')
  const commit = (id: string) => find('s22-progress', id, 'commit')
  const at = (id: string) => events.findIndex((e) => e.id === id)
  // шаги внутри запросов — агента, остальные — человека: меню, файл замеров, curl, браузер, коммиты
  const inner = new Set(['ask-measure', 'ask-photos', 'ask-private', 'ask-private-go'].flatMap((id) => agent(id).steps))
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }
  const BASE = 'http://localhost:3000'
  const out = (id: string) => run(id).out.join('\n')
  expect(run('typegen')).toMatchObject({ cmd: 'npx next typegen', code: 0 })

  // замеры: RLS сразу, миграция — с подтверждения; негативный тест — Света не видит замеры Анны
  expect(agent('ask-measure').prompt).toBe(
    'Замеры тела — вес, талия, бёдра по датам: у подопечного форма, у тренера строки на карточке. RLS сразу, миграцию — с подтверждения',
  )
  expect(agent('ask-measure').steps).toEqual(['m-sql', 'm-apply', 'm-page', 'm-actions', 'm-coach', 'm-test', 'm-run'])
  const sql = file('m-sql')
  expect(sql).toMatchObject({ path: 'supabase/migrations/0011_measurements.sql', before: null })
  for (const part of ['create table measurements', 'day date not null', 'check (weight > 0)', 'check (waist > 0)', 'check (hips > 0)', 'alter table measurements enable row level security']) {
    expect(sql.after, part).toContain(part)
  }
  expect(sql.after.match(/create policy/g)).toHaveLength(2)
  expect(run('m-apply')).toMatchObject({ cmd: 'psql -f supabase/migrations/0011_measurements.sql', code: 0, out: ['CREATE TABLE', 'ALTER TABLE', 'CREATE POLICY', 'CREATE POLICY'] })
  expect(['m-page', 'm-actions', 'm-coach'].map((id) => file(id).path)).toEqual(['app/measurements/page.tsx', 'app/measurements/actions.ts', 'app/clients/[id]/page.tsx'])
  // дата замера — в форме, не от часов
  expect(file('m-page').after).toContain('type="date"')
  for (const id of ['m-page', 'm-actions', 'm-coach', 'ph-route', 'pr-lib', 'pr-store', 'pr-get']) expect(file(id).after, id).not.toMatch(/new Date\(\)|Date\.now\(\)/)
  const dbTest = file('m-test')
  expect(dbTest).toMatchObject({ path: 'test/measurements.test.ts', before: null })
  for (const part of ['Марина, тренер Анны, видит её замеры', 'Света, подопечная Игоря, не видит замеры Анны', 'row-level security']) {
    expect(dbTest.after, part).toContain(part)
  }
  expect(run('m-run')).toMatchObject({ cmd: 'npx vitest run test/measurements.test.ts', code: 0 })
  expect(out('m-run')).toMatch(/Tests\s+4 passed \(4\)/)
  // меню подопечного — «Замеры»; сквозной тест s20 знает меню дословно
  expect(file('m-nav')).toMatchObject({ path: 'components/Nav.tsx' })
  expect(file('m-nav').after).toContain('["/measurements", "Замеры"]')
  expect(file('m-e2e').after).toContain('toHaveText(["Мои тренировки", "Питание", "Замеры"])')
  expect(commit('c-measure')).toMatchObject({ message: 'Замеры тела', branch: 'main', parents: [find('s21-nutrition', 'c-one', 'commit').hash] })
  expect(commit('c-measure').files.map((f) => f.path)).toEqual(
    expect.arrayContaining(['supabase/migrations/0011_measurements.sql', 'app/measurements/page.tsx', 'app/measurements/actions.ts', 'test/measurements.test.ts']),
  )

  // замеры Анны — файл человека с датами, а не часы
  const data = file('m-data-file')
  expect(data).toMatchObject({ path: 'supabase/tests/measurements.sql', before: null })
  for (const day of ['2026-10-16', '2026-10-23', '2026-10-30', '2026-11-06']) expect(data.after, day).toContain(`(1, '${day}'`)
  expect(run('m-data-apply')).toMatchObject({ cmd: 'psql -f supabase/tests/measurements.sql', code: 0, out: ['INSERT 0 4'] })

  // фото «просто»: снимок — в public/uploads, в строке — адрес
  expect(agent('ask-photos').prompt).toBe('Фото прогресса раз в месяц: подопечный загружает снимок, тренер видит. Сделай просто')
  expect(agent('ask-photos').steps).toEqual(['ph-sql', 'ph-apply', 'ph-route', 'ph-page', 'ph-coach'])
  expect(file('ph-sql')).toMatchObject({ path: 'supabase/migrations/0012_photos.sql', before: null })
  for (const part of ['create table photos', 'path text not null', 'alter table photos enable row level security']) expect(file('ph-sql').after, part).toContain(part)
  expect(run('ph-apply')).toMatchObject({ cmd: 'psql -f supabase/migrations/0012_photos.sql', code: 0, out: ['CREATE TABLE', 'ALTER TABLE', 'CREATE POLICY', 'CREATE POLICY'] })
  expect(file('ph-route')).toMatchObject({ path: 'app/api/photos/route.ts', before: null })
  expect(file('ph-route').after).toContain('const path = `/uploads/${clientId}/${day}.jpg`;')
  expect(file('ph-route').after).toContain('"public"')
  for (const id of ['ph-page', 'ph-coach']) expect(file(id).after, id).toContain('<a href={photo.path}')
  expect(commit('c-photos')).toMatchObject({ message: 'Фото прогресса', branch: 'main', parents: [commit('c-measure').hash] })

  // у Анны — четыре замера по датам из файла (Review Focus 2: даты те же в любой день записи)
  expect(run('dev')).toMatchObject({ cmd: 'npm run dev', code: null })
  expect(browser('login-anna').urlAfter).toBe(`${BASE}/workouts`)
  const anna = browser('anna-measure')
  expect(anna.url).toBe(`${BASE}/measurements`)
  expect(anna.after.join('\n')).toContain('16 октября')
  expect(anna.after.join('\n')).toContain('6 ноября')
  const rows = anna.after.filter((line) => /^\d+ \S+: вес [\d,]+ кг, талия [\d,]+ см, бёдра [\d,]+ см$/.test(line))
  expect(rows.map((line) => line.split(':')[0])).toEqual(['16 октября', '23 октября', '30 октября', '6 ноября'])

  // снимок и cookie — вне проекта (~ — домашняя папка записи); загрузка — curl -F, день — в форме
  expect(run('photo-make')).toMatchObject({ cmd: 'convert -size 600x800 xc:gray $HOME/photo.jpg', code: 0 })
  expect(run('anna-curl').cmd).toContain('-c ~/anna.txt')
  expect(run('anna-curl').out).toEqual(['{"role":"client"}'])
  const upload = 'curl -s -b ~/anna.txt -F photo=@$HOME/photo.jpg -F day=2026-11-13 http://localhost:3000/api/photos'
  expect(run('photo-upload')).toMatchObject({ cmd: upload, code: 0, out: ['{"id":"1","path":"/uploads/1/2026-11-13.jpg"}'] })
  // подводный камень: без cookie адрес из public открывается — 200 и image/jpeg; и папка снимков просится в git
  const STATUS = "| grep -iE '^(http|content-type)'"
  expect(run('photo-open').cmd).toBe(`curl -sI ${BASE}/uploads/1/2026-11-13.jpg ${STATUS}`)
  expect(out('photo-open')).toContain('200')
  expect(out('photo-open')).toContain('image/jpeg')
  expect(run('photo-git')).toMatchObject({ cmd: 'git status --short', code: 0 })
  expect(out('photo-git')).toContain('public/uploads/')

  // исправление: сначала тест — красный на самой беде (снимок теста лёг в public, PNG под именем photo.jpg принят), вторым ходом —
  // правки, тест зелёный
  expect(agent('ask-private').prompt).toBe(
    'Фото открывается без входа по угадываемому адресу и лежит в public, рядом с кодом. Сделай: файлы вне public и вне git, ' +
      'выдача только вошедшему — подопечному и его тренеру — через RLS, удаление — строка и файл. Сначала тест',
  )
  expect(agent('ask-private').steps).toEqual(['pr-test', 'pr-vitest', 'pr-red'])
  expect(agent('ask-private-go')).toMatchObject({ prompt: 'Делай', steps: ['pr-lib', 'pr-store', 'pr-get', 'pr-page', 'pr-coach', 'pr-ignore', 'pr-clean', 'pr-green'] })
  const photosTest = file('pr-test')
  expect(photosTest).toMatchObject({ path: 'test/photos.test.ts', before: null })
  // чужие снимку Анны — не только Света: другой тренер и другой подопечный того же тренера; строка без файла — 404
  for (const part of ['const OTHERS = [SVETA, IGOR, OLEG];', 'for (const uid of OTHERS) expect((await open(uid)).status, uid).toBe(404);', 'строка есть, а файла нет — 404, а не 500', '"x-content-type-options"']) {
    expect(photosTest.after, part).toContain(part)
  }
  expect(file('pr-vitest').after).toContain('resolve: { tsconfigPaths: true }')
  const unit = 'npx vitest run test/photos.test.ts'
  expect(run('pr-red').cmd).toBe(unit)
  expect(run('pr-red').code).not.toBe(0)
  expect(run('pr-red').out).toContain('+   "uploads/1/2026-10-13.jpg",')
  // загрузка поверила типу из запроса: PNG под именем photo.jpg — 201
  expect(run('pr-red').out).toContain('AssertionError: expected 201 to be 400 // Object.is equality')
  expect(out('pr-red')).toMatch(/Tests\s+5 failed \(5\)/)
  // где лежат снимки: путь — из номера подопечного и дня, «../» не пройдёт
  const lib = file('pr-lib')
  expect(lib).toMatchObject({ path: 'lib/photos.ts', before: null })
  for (const part of ['return `storage/photos/${clientId}/${day}.jpg`;', "if (!/^\\d+$/.test(clientId) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(day)) throw", '/*turbopackIgnore: true*/']) {
    expect(lib.after, part).toContain(part)
  }
  // загрузка: JPEG — по первым байтам, а не по типу из запроса; до 10 МБ
  const store = file('pr-store').after
  for (const part of ['const MAX_BYTES = 10 * 1024 * 1024;', 'status: 413', 'if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {', 'const file = photoFile(clientId, day);']) {
    expect(store, part).toContain(part)
  }
  expect(store).not.toContain('photo.type')
  expect(store).not.toContain('"public"')
  const byId = file('pr-get')
  expect(byId).toMatchObject({ path: 'app/api/photos/[id]/route.ts', before: null })
  for (const part of ['export async function GET(', 'export async function DELETE(', 'status: 401', 'status: 404', 'asUser(uid', '"X-Content-Type-Options": "nosniff"']) {
    expect(byId.after, part).toContain(part)
  }
  // файл — по номеру подопечного и дню из строки, а не по строке пути; нет файла — 404, а не 500
  expect(byId.after).toContain('delete from photos where id = $1 returning client_id, day::text as day')
  expect(byId.after).toContain('await readFile(photoFile(photo.client_id, photo.day)).catch(() => null)')
  expect(byId.after).not.toContain('.path')
  for (const id of ['pr-page', 'pr-coach']) {
    expect(file(id).after, id).toContain('<a href={`/api/photos/${photo.id}`}')
    expect(file(id).after, id).not.toContain('photo.path')
  }
  expect(file('pr-ignore')).toMatchObject({ path: '.gitignore' })
  expect(file('pr-ignore').after).toContain('\n/storage/\n')
  expect(run('pr-clean')).toMatchObject({ cmd: 'rm -r public/uploads', code: 0 })
  expect(run('pr-green')).toMatchObject({ cmd: unit, code: 0 })
  expect(out('pr-green')).toMatch(/Tests\s+5 passed \(5\)/)
  expect(at('pr-red')).toBeLessThan(at('pr-store'))
  expect(commit('c-private')).toMatchObject({ message: 'Фото — только своим, удаление вместе с файлом', branch: 'main', parents: [commit('c-photos').hash] })

  // после: тот же снимок — новый адрес; без входа 401, Свете 404, Марине — снимок; старый адрес — 404
  const NEW = `${BASE}/api/photos/1`
  expect(run('photo-upload2')).toMatchObject({ cmd: upload, code: 0, out: ['{"id":"1","url":"/api/photos/1"}'] })
  // снимок на диске, а git его не видит: в git ничего не просится
  expect(run('photo-git2')).toMatchObject({ cmd: 'git status --short', code: 0 })
  expect(out('photo-git2')).not.toMatch(/uploads|storage/)
  expect(run('photo-git2').out).toEqual([])
  expect(at('photo-upload2') + 1).toBe(at('photo-git2'))
  expect(run('photo-anon').cmd).toBe(`curl -sI ${NEW} ${STATUS}`)
  expect(out('photo-anon')).toContain('401')
  expect(run('photo-sveta').cmd).toBe(`curl -sI -b ~/sveta.txt ${NEW} ${STATUS}`)
  expect(out('photo-sveta')).toContain('404')
  expect(run('photo-marina').cmd).toBe(`curl -sI -b ~/marina.txt ${NEW} ${STATUS}`)
  expect(out('photo-marina')).toContain('200')
  expect(out('photo-marina')).toContain('image/jpeg')
  expect(run('photo-old').cmd).toBe(run('photo-open').cmd)
  expect(out('photo-old')).toContain('404')
  expect(run('sveta-curl').out).toEqual(['{"role":"client"}'])
  expect(run('marina-curl').out).toEqual(['{"role":"coach"}'])
  // настоящих часов в кадре нет: заголовки Date и Last-Modified в вывод не попали
  for (const id of ['photo-open', 'photo-anon', 'photo-sveta', 'photo-marina', 'photo-old', 'photo-del']) expect(out(id), id).not.toMatch(/GMT/)

  // у Марины на карточке — замеры Анны по датам и снимок; перед её входом Анна вышла через меню
  expect(browser('anna-logout').urlAfter).toBe(`${BASE}/login`)
  expect(at('anna-logout') + 1).toBe(at('login-marina'))
  expect(browser('login-marina').buttons).toEqual(['Войти'])
  const coach = browser('coach-measure')
  expect(coach.url).toBe(`${BASE}/clients/1`)
  for (const line of ['16 октября: вес 64,8 кг, талия 74 см, бёдра 99 см', '6 ноября: вес 64,3 кг, талия 72 см, бёдра 97,5 см', 'Снимок 13 ноября']) {
    expect(coach.after, line).toContain(line)
  }

  // Анна удаляет снимок — строки и файла нет
  expect(run('photo-del').cmd).toBe(`curl -si -X DELETE -b ~/anna.txt ${NEW} ${STATUS}`)
  expect(out('photo-del')).toContain('204')
  expect(run('photo-ls')).toMatchObject({ cmd: 'ls storage/photos/1; psql -At -c "select count(*) from photos"', code: 0 })
  expect(run('photo-ls').out.at(-1)).toBe('0')
  expect(run('photo-ls').out.filter(Boolean)).toEqual(['0'])

  // файлов людей нет ни в одном коммите сессии: снимков, копий базы, cookie (Review Focus 3)
  for (const e of events) {
    if (e.kind !== 'commit') continue
    expect(e.files.filter((f) => /^(public\/uploads|storage|backups)\//.test(f.path) || /\.(jpg|txt)$/.test(f.path)), e.id).toEqual([])
  }
})

test('s23: без сети подход пропадал; очередь; потерянный ответ даёт дубль, ключ — один раз', () => {
  const events = sessions['s23-offline'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['typegen', 'why-grep', 'ask-offline-test', 'off-e2e', 'off-red'],
    ...['ask-queue', 'q-lib', 'q-queue', 'q-queue-test', 'q-unit'],
    ...['ask-queue-go', 'q-route', 'q-form', 'q-page', 'q-actions', 'q-green', 'cycle-wait', 'quick-wait', 'c-queue'],
    ...['ask-lost', 'lost-e2e', 'lost-red', 'lost-db'],
    ...['ask-key', 'key-sql', 'key-apply', 'key-route', 'key-green', 'c-key'],
  ])
  const run = (id: string) => find('s23-offline', id, 'run')
  const file = (id: string) => find('s23-offline', id, 'file')
  const agent = (id: string) => find('s23-offline', id, 'agent')
  const commit = (id: string) => find('s23-offline', id, 'commit')
  const at = (id: string) => events.findIndex((e) => e.id === id)
  const out = (id: string) => run(id).out.join('\n')
  // шаги внутри запросов — агента, остальные — человека: вопрос из отзывов, ожидание в тестах s07 и s18, psql, коммиты
  const inner = new Set(['ask-offline-test', 'ask-queue', 'ask-queue-go', 'ask-lost', 'ask-key'].flatMap((id) => agent(id).steps))
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }
  expect(run('typegen')).toMatchObject({ cmd: 'npx next typegen', code: 0 })
  // в сессии нет ни браузера, ни часов: подходы пишет сквозной тест, в файлах агента нет «сегодня»
  expect(events.filter((e) => e.kind === 'browser')).toEqual([])
  for (const id of ['off-e2e', 'q-lib', 'q-queue', 'q-route', 'q-form', 'lost-e2e', 'key-route']) expect(file(id).after, id).not.toMatch(/new Date\(\)|Date\.now\(\)/)

  // повод — вопрос Анны в отзывах (s13)
  expect(run('why-grep')).toMatchObject({ cmd: 'grep -n "интернет" docs/feedback.md', code: 0 })
  expect(out('why-grep')).toContain('интернет')

  // сначала сквозной тест: сеть отключает Playwright; без сети форма и «Повторить подход» подход не сохраняют — пометки «не отправлено» нет
  expect(agent('ask-offline-test')).toMatchObject({
    prompt:
      'Подход в зале без интернета: сначала сквозной тест — без сети подход сохраняется с пометкой «не отправлено», ' +
      'сеть вернулась — уходит, тренер видит',
    steps: ['off-e2e', 'off-red'],
  })
  const spec = file('off-e2e')
  expect(spec).toMatchObject({ path: 'e2e/offline.spec.ts', before: null })
  // тренировка 3 «Грудь и плечи»: «Ноги» (1) считает e2e/quick-set.spec.ts, а в s26 тесты идут параллельно
  for (const part of ['await anna.context().setOffline(true);', 'await anna.context().setOffline(false);', 'anna.goto("/workouts/3")', 'marina.goto("/clients/1")', '"50 кг, 10 повторов — не отправлено"', '"50 кг, 10 повторов — отправлено"', 'const before = await seen.count();', 'toHaveCount(before + 1)', 'test("без сети «Повторить подход» тоже ждёт в очереди"']) {
    expect(spec.after, part).toContain(part)
  }
  expect(spec.after).not.toContain('/workouts/1"')
  const E2E = 'npx playwright test e2e/offline.spec.ts'
  expect(run('off-red').cmd).toBe(E2E)
  expect(run('off-red').code).not.toBe(0)
  // форма и «Повторить подход» — серверные действия: без сети запрос не ушёл, браузер пишет об этом в журнал сервера
  expect(run('off-red').out.filter((line) => line.includes('Uncaught TypeError: Failed to fetch'))).toHaveLength(2)
  expect(run('off-red').out).toContain("    Locator: getByText('50 кг, 10 повторов — не отправлено')")
  expect(run('off-red').out).toContain("    Locator: getByText('35 кг, 8 повторов — не отправлено')")
  expect(run('off-red').out.filter((line) => line === '    Error: element(s) not found')).toHaveLength(2)
  expect(out('off-red')).toMatch(/^ {2}2 failed$/m)

  // очередь на телефоне, первым ходом: свой модуль — своя у каждого вошедшего, по порядку; тест без браузера
  expect(agent('ask-queue')).toMatchObject({
    prompt:
      'Сделай очередь на телефоне: подход сначала в очередь, отправка по порядку, «отправлено» — только после ответа сервера. ' +
      'У каждого подхода свой номер',
    steps: ['q-lib', 'q-queue', 'q-queue-test', 'q-unit'],
  })
  expect(file('q-lib')).toMatchObject({ path: 'lib/sets.ts', before: null })
  for (const part of ['export function parseSet(', 'if (reps > 1000)', 'if (weight > 1000)']) expect(file('q-lib').after, part).toContain(part)
  const queue = file('q-queue')
  expect(queue).toMatchObject({ path: 'lib/queue.ts', before: null })
  for (const part of ['export const queueKey = (userId: string) => `sets-queue:${userId}`;', 'Array.isArray(parsed) ? parsed.filter(isQueued) : []', 'Math.min(3000 * 2 ** attempt, 60_000)', 'key: crypto.randomUUID()', 'status: "не принято"']) {
    expect(queue.after, part).toContain(part)
  }
  const queueTest = file('q-queue-test')
  expect(queueTest).toMatchObject({ path: 'lib/queue.test.ts', before: null })
  for (const part of ['очередь — своя у каждого: подход Анны не уходит под входом Олега', 'сервер отказал — подход уходит из очереди с «не принято» и не держит следующие', 'испорченная очередь в хранилище']) {
    expect(queueTest.after, part).toContain(part)
  }
  expect(run('q-unit')).toMatchObject({ cmd: 'npx vitest run lib/queue.test.ts', code: 0 })
  expect(out('q-unit')).toMatch(/Tests\s+6 passed \(6\)/)

  // вторым ходом («Делай»): маршрут — JSON, cookie, asUser; форма и «Повторить подход» — через очередь вошедшего
  expect(agent('ask-queue-go')).toMatchObject({ prompt: 'Делай', steps: ['q-route', 'q-form', 'q-page', 'q-actions', 'q-green'] })
  const route = file('q-route')
  // прототип s02 /api/sets остаётся до s26 — новый маршрут под тренировкой
  expect(route).toMatchObject({ path: 'app/api/workouts/[id]/sets/route.ts', before: null })
  for (const part of ['export async function POST(request: Request, { params }: RouteContext<"/api/workouts/[id]/sets">)', 'await currentUser()', 'await request.json()', 'asUser(uid', 'status: 401', 'status: 404', 'Response.json({ status: "принято" }, { status: 201 })']) {
    expect(route.after, part).toContain(part)
  }
  // номер подхода сервер пока не знает
  expect(route.after).not.toMatch(/client_key|body\.key/)
  const form = file('q-form')
  expect(form).toMatchObject({ path: 'components/SetForm.tsx', before: null })
  for (const part of ['"use client";', 'enqueue(store, userId, { ...set, workoutId })', 'window.addEventListener("online", sendNow)', 'navigator.onLine', 'retryDelay(attempt++)', 'AbortSignal.timeout(15_000)', 'Повторить подход ({last.weight} кг, {repsText(last.reps)})', '<div aria-live="polite" className="mt-4">']) {
    expect(form.after, part).toContain(part)
  }
  // в очереди — «50 кг, 10 повторов», а не «50 кг × 10»: строку подхода e2e/cycle.spec.ts ищет по «50 кг × 10»
  expect(form.after).not.toContain('кг ×')
  expect(file('q-page')).toMatchObject({ path: 'app/workouts/[id]/page.tsx' })
  expect(file('q-page').before).toContain('<form action={save}')
  expect(file('q-page').before).toContain('<form action={repeatSet.bind(null, id, last.id)}')
  expect(file('q-page').after).toContain('<SetForm workoutId={id} userId={uid} last={last ? { weight: last.weight, reps: last.reps } : null} />')
  expect(file('q-page').after).not.toMatch(/saveSet|repeatSet|<form/)
  // серверные действия страницы тренировки больше никто не вызывает — файл удалён буквальным путём
  expect(run('q-actions')).toMatchObject({ cmd: "rm 'app/workouts/[id]/actions.ts'", code: 0, files: [{ path: 'app/workouts/[id]/actions.ts', blob: null }] })
  expect(run('q-green')).toMatchObject({ cmd: E2E, code: 0 })
  expect(out('q-green')).toMatch(/^ {2}2 passed /m)
  expect(at('off-red')).toBeLessThan(at('q-form'))
  // человек: подход в тестах s07 и s18 уходит через очередь и маршрут — ждём до 15 с
  expect(file('cycle-wait')).toMatchObject({ path: 'e2e/cycle.spec.ts' })
  expect(file('cycle-wait').after).toContain('await expect(anna.getByText("50 кг × 10")).toBeVisible({ timeout: 15_000 });')
  expect(file('quick-wait')).toMatchObject({ path: 'e2e/quick-set.spec.ts' })
  expect(file('quick-wait').after).toContain('await expect(sets).toHaveCount(before + 1, { timeout: 15_000 });')
  expect(commit('c-queue')).toMatchObject({ message: 'Подход без связи: очередь на отправку', branch: 'main', parents: [find('s22-progress', 'c-private', 'commit').hash] })
  const queued = commit('c-queue').files.map((f) => f.path)
  expect(queued).toEqual(expect.arrayContaining(['e2e/offline.spec.ts', 'lib/sets.ts', 'lib/queue.ts', 'lib/queue.test.ts', 'app/api/workouts/[id]/sets/route.ts', 'components/SetForm.tsx']))
  expect(queued).not.toContain('app/workouts/[id]/actions.ts')

  // подводный камень: ответ потерялся — телефон отправил снова, у тренера две строки (ожидали 1, получили 2)
  expect(agent('ask-lost')).toMatchObject({
    prompt: 'Проверь случай: сервер подход принял, а ответ потерялся — телефон отправит снова',
    steps: ['lost-e2e', 'lost-red'],
  })
  const lost = file('lost-e2e')
  expect(lost).toMatchObject({ path: 'e2e/offline.spec.ts', before: spec.after })
  for (const part of ['test("ответ потерялся — один подход, одна строка"', '"**/api/workouts/3/sets"', 'await route.fetch();', 'await route.abort();', '{ times: 1 }', 'expect((await seen.count()) - before, "строк подхода у тренера").toBe(1);']) {
    expect(lost.after, part).toContain(part)
  }
  expect(run('lost-red').cmd).toBe(E2E)
  expect(run('lost-red').code).not.toBe(0)
  expect(run('lost-red').out).toContain('    Error: строк подхода у тренера')
  expect(run('lost-red').out).toContain('    Expected: 1')
  expect(run('lost-red').out).toContain('    Received: 2')
  // первые два теста — очередь без сети — по-прежнему зелёные
  expect(out('lost-red')).toMatch(/^ {2}1 failed$/m)
  expect(out('lost-red')).toMatch(/^ {2}2 passed /m)
  expect(run('lost-db')).toMatchObject({ cmd: 'psql -At -c "select count(*) from sets where workout_id = 3"', code: 0 })
  // три подхода «Груди и плеч» из seed; q-green — два (форма и «Повторить подход»), lost-red — те же два и два от потерянного ответа
  expect(run('lost-db').out).toEqual(['9'])

  // номер подхода принимается один раз: unique в базе, on conflict do nothing, на повтор — тот же ответ
  expect(agent('ask-key')).toMatchObject({
    prompt: 'Сервер должен принимать номер подхода один раз: уникальный ключ в базе, на повтор — «принято». Миграцию — с подтверждения',
    steps: ['key-sql', 'key-apply', 'key-route', 'key-green'],
  })
  const sql = file('key-sql')
  expect(sql).toMatchObject({ path: 'supabase/migrations/0013_sets_client_key.sql', before: null })
  // столбец допускает null: у подходов seed.sql номера нет (Review Focus 1 — 0013 применяется со следующей сессии, шаг schema в s24)
  expect(sql.after).toContain('alter table sets add column client_key uuid unique;')
  expect(sql.after).not.toContain('not null')
  expect(run('key-apply')).toMatchObject({ cmd: 'psql -f supabase/migrations/0013_sets_client_key.sql', code: 0, out: ['ALTER TABLE'] })
  const keyRoute = file('key-route')
  expect(keyRoute).toMatchObject({ path: 'app/api/workouts/[id]/sets/route.ts', before: route.after })
  for (const part of ['insert into sets (workout_id, weight, reps, note, client_key)', 'on conflict (client_key) do nothing', 'status: 400']) {
    expect(keyRoute.after, part).toContain(part)
  }
  // ответ один — и на первый раз, и на повтор
  expect(keyRoute.after.match(/Response\.json\(\{ status: "принято" \}/g)).toHaveLength(1)
  expect(run('key-green')).toMatchObject({ cmd: E2E, code: 0 })
  expect(out('key-green')).toMatch(/^ {2}3 passed /m)
  expect(commit('c-key')).toMatchObject({ message: 'Без дублей: номер подхода принимается один раз', branch: 'main', parents: [commit('c-queue').hash] })
  expect(commit('c-key').files.map((f) => f.path)).toEqual(
    expect.arrayContaining(['supabase/migrations/0013_sets_client_key.sql', 'app/api/workouts/[id]/sets/route.ts', 'e2e/offline.spec.ts']),
  )
  expect(queued).not.toContain('supabase/migrations/0013_sets_client_key.sql')
  // отчёты Playwright — не в коммитах (test-results/ и playwright-report/ в .gitignore)
  for (const e of events) {
    if (e.kind === 'commit') expect(e.files.filter((f) => /^(test-results|playwright-report)\//.test(f.path)), e.id).toEqual([])
  }
})

test('s24: обычное приглашение заводит тренера беты подопечной; тренерское — тренером; замечание в таблице; сбой — понятная страница и строка журнала', () => {
  const events = sessions['s24-beta'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['typegen', 'schema', 'beta-doc', 'c-beta-doc', 'dev', 'login-marina', 'invite-coach', 'marina-logout', 'polina-join', 'polina-db'],
    ...['ask-coach-invite', 'ci-test', 'ci-red', 'ask-coach-invite-go', 'ci-sql', 'ci-apply', 'ci-page', 'ci-join', 'ci-green', 'c-coach-invite'],
    ...['beta-invites-file', 'beta-invites-ignore', 'beta-invites-apply', 'polina-logout', 'timur-join', 'timur-db'],
    ...['ask-report', 'fb-sql', 'fb-apply', 'fb-page', 'fb-action', 'fb-link', 'fb-nav', 'fb-e2e', 'c-feedback', 'dev-restart'],
    ...['timur-feedback', 'fb-db', 'crash', 'errors-before'],
    ...['ask-errors', 'err-test', 'err-red', 'ask-errors-go', 'err-sql', 'err-apply', 'err-page', 'err-hook', 'err-pool', 'err-green'],
    'c-errors',
    ...['crash2', 'errors-db'],
  ])
  const run = (id: string) => find('s24-beta', id, 'run')
  const file = (id: string) => find('s24-beta', id, 'file')
  const agent = (id: string) => find('s24-beta', id, 'agent')
  const browser = (id: string) => find('s24-beta', id, 'browser')
  const commit = (id: string) => find('s24-beta', id, 'commit')
  const at = (id: string) => events.findIndex((e) => e.id === id)
  const out = (id: string) => run(id).out.join('\n')
  const text = (lines: string[]) => lines.join('\n')
  // шаги внутри запросов — агента, остальные — человека: план беты, файл приглашений, правка теста меню, psql, браузер, коммиты
  const inner = new Set(['ask-coach-invite', 'ask-coach-invite-go', 'ask-report', 'ask-errors', 'ask-errors-go'].flatMap((id) => agent(id).steps))
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }
  const BASE = 'http://localhost:3000'
  expect(run('typegen')).toMatchObject({ cmd: 'npx next typegen', code: 0 })

  // миграции 0010–0013 применил рекордер: client_key и его уникальный индекс из 0013 на месте (Review Focus 1)
  expect(run('schema')).toMatchObject({ cmd: 'psql -c "\\d sets"', code: 0 })
  expect(out('schema')).toMatch(/^ client_key +\| uuid +\| +\| +\| *$/m)
  expect(run('schema').out).toContain('    "sets_client_key_key" UNIQUE CONSTRAINT, btree (client_key)')

  // план беты — человек, текст авторский; срок — дата, а не «через неделю» от сегодняшнего дня (Review Focus 2)
  const doc = file('beta-doc')
  expect(doc).toMatchObject({ path: 'docs/beta.md', before: null })
  for (const part of ['Полина, Тимур и Ксения — тренеры из других залов', '22 ноября', 'Пригласить своего подопечного', 'Назначить ему программу', 'Открыть отчёт за месяц', '«Сообщить о проблеме»', 'что делали, что ожидали, что вышло', 'смотрим молча', '«Нравится?» не спрашиваем']) {
    expect(doc.after, part).toContain(part)
  }
  expect(doc.after).not.toMatch(/Анна|Анн[уыео]/)
  expect(commit('c-beta-doc')).toMatchObject({ message: 'План беты', branch: 'main', parents: [find('s23-offline', 'c-key', 'commit').hash] })

  // подводный камень: обычное приглашение Марины заводит тренера беты подопечной
  expect(browser('login-marina').urlAfter).toBe(`${BASE}/clients`)
  const link = text(browser('invite-coach').after).match(/\/join\/[0-9a-f]{32}/)![0]
  // смена человека — через «Выйти»: над формой приглашения нет меню Марины
  expect(browser('marina-logout').urlAfter).toBe(`${BASE}/login`)
  const polina = browser('polina-join')
  expect(polina.url).toBe(`${BASE}${link}`)
  expect(polina.before).toEqual(['Приглашение', 'Тренер Марина приглашает вас в дневник тренировок. Ссылка одноразовая.', 'Имя', 'Почта', 'Пароль', 'Присоединиться'])
  expect(polina.fields).toEqual([
    { label: 'Имя', value: 'Полина' },
    { label: 'Почта', value: 'polina@example.com' },
    { label: 'Пароль', value: 'demo-password' },
  ])
  expect(polina.urlAfter).toBe(`${BASE}/workouts`)
  expect(polina.after.slice(0, 6)).toEqual(['Мои тренировки', 'Питание', 'Замеры', 'Выйти', 'Мои тренировки', 'Тренировок пока нет'])
  expect(run('polina-db').code).toBe(0)
  expect(run('polina-db').out).toContain(' Полина | client | t')

  // тренерское приглашение: сначала тест — красный, вторым ходом («Делай») миграция, страница и регистрация — зелёный
  expect(agent('ask-coach-invite')).toMatchObject({
    prompt:
      'Тренерам беты нужно своё приглашение: по нему заводится тренер, а не подопечный. Создаёт его только владелец базы, ' +
      'кнопки в приложении нет. Сначала тест',
    steps: ['ci-test', 'ci-red'],
  })
  const ciTest = file('ci-test')
  expect(ciTest.path).toBe('test/invites.test.ts')
  expect(ciTest.before).not.toContain('тренерское приглашение')
  for (const part of ['test("тренерское приглашение — тренер без записи в clients; обычное — подопечный тренера"', `"insert into invites (role) values ('coach') returning code"`, '{ role: "coach", coach_id: null }', '{ role: "client", coach_id: MARINA }', 'test("тренер тренерского приглашения не создаст: роль пишет только владелец базы"', 'rejects.toThrow("permission denied")']) {
    expect(ciTest.after, part).toContain(part)
  }
  const VITEST = 'npx vitest run test/invites.test.ts'
  expect(run('ci-red').cmd).toBe(VITEST)
  expect(run('ci-red').code).not.toBe(0)
  // красный на самой беде: тренерского приглашения в базе нет; прежние шесть тестов — зелёные
  expect(run('ci-red').out).toContain('error: column "role" of relation "invites" does not exist')
  expect(out('ci-red')).toMatch(/Tests {2}2 failed \| 6 passed \(8\)/)
  expect(agent('ask-coach-invite-go')).toMatchObject({ prompt: 'Делай', steps: ['ci-sql', 'ci-apply', 'ci-page', 'ci-join', 'ci-green'] })
  const sql = file('ci-sql')
  expect(sql).toMatchObject({ path: 'supabase/migrations/0014_coach_invites.sql', before: null })
  for (const part of ["alter table invites add column role text not null default 'client' check (role in ('client', 'coach'));", 'alter table invites alter column coach_id drop not null;', "update profiles set role = 'coach' where id = new_user;", 'insert into clients (coach_id, user_id, name) values (invite.coach_id, new_user, client_name);', 'returns text', 'revoke execute on function accept_invite(text, uuid, text) from public, anon, authenticated;']) {
    expect(sql.after, part).toContain(part)
  }
  // кнопки нет: тренер по-прежнему пишет в invites только coach_id (права по столбцам из 0008)
  expect(sql.after).not.toMatch(/grant/i)
  expect(run('ci-apply')).toMatchObject({ cmd: 'psql -f supabase/migrations/0014_coach_invites.sql', code: 0 })
  expect(run('ci-apply').out).toEqual(['ALTER TABLE', 'ALTER TABLE', 'ALTER TABLE', 'DROP FUNCTION', 'CREATE FUNCTION', 'REVOKE'])
  expect(file('ci-page')).toMatchObject({ path: 'app/join/[code]/page.tsx' })
  expect(file('ci-page').after).toContain('left join profiles p on p.id = i.coach_id')
  expect(file('ci-page').after).toContain('Вас приглашают в дневник тренировок тренером: подопечных вы пригласите сами.')
  expect(file('ci-join')).toMatchObject({ path: 'app/join/[code]/actions.ts' })
  expect(file('ci-join').before).toContain('redirect("/workouts");')
  expect(file('ci-join').after).toContain('redirect(role === "coach" ? "/clients" : "/workouts");')
  expect(run('ci-green')).toMatchObject({ cmd: VITEST, code: 0 })
  expect(out('ci-green')).toMatch(/Tests {2}8 passed \(8\)/)
  expect(at('ci-red')).toBeLessThan(at('ci-sql'))
  expect(commit('c-coach-invite')).toMatchObject({ message: 'Приглашение тренера', branch: 'main', parents: [commit('c-beta-doc').hash] })
  expect(commit('c-coach-invite').files.map((f) => f.path)).toEqual(
    expect.arrayContaining(['supabase/migrations/0014_coach_invites.sql', 'test/invites.test.ts', 'app/join/[code]/actions.ts', 'app/join/[code]/page.tsx']),
  )

  // тренерские приглашения создаёт только владелец базы — файл человека с заданными кодами; Тимур открывает свой
  const invites = file('beta-invites-file')
  expect(invites).toMatchObject({ path: 'supabase/tests/beta-invites.sql', before: null })
  // коды приглашений — как пароли: файл сразу в .gitignore, ни в одном коммите сессии его нет
  expect(invites.after).toContain('Коды приглашений — как пароли: файл в .gitignore, в git он не попадает.')
  const ignore = file('beta-invites-ignore')
  expect(ignore.path).toBe('.gitignore')
  expect(ignore.after).toContain('# тренерские приглашения беты: коды приглашений — как пароли, в git не кладём\n/supabase/tests/beta-invites.sql\n')
  expect(at('beta-invites-ignore')).toBeLessThan(at('c-feedback'))
  for (const e of events) {
    if (e.kind === 'commit') expect(e.files.map((f) => f.path), e.id).not.toContain('supabase/tests/beta-invites.sql')
  }
  const codes = [...invites.after.matchAll(/\('coach', '([0-9a-f]{32})'\)[,;] -- (Тимур|Ксения)$/gm)].map((m) => [m[2], m[1]])
  expect(codes.map(([name]) => name)).toEqual(['Тимур', 'Ксения'])
  expect(run('beta-invites-apply')).toMatchObject({ cmd: 'psql -f supabase/tests/beta-invites.sql', code: 0, out: ['INSERT 0 2'] })
  expect(browser('polina-logout').urlAfter).toBe(`${BASE}/login`)
  const timur = browser('timur-join')
  expect(timur.url).toBe(`${BASE}/join/${codes[0][1]}`)
  expect(timur.before).toEqual(['Приглашение', 'Вас приглашают в дневник тренировок тренером: подопечных вы пригласите сами. Ссылка одноразовая.', 'Имя', 'Почта', 'Пароль', 'Присоединиться'])
  expect(timur.fields.map((f) => f.value)).toEqual(['Тимур', 'timur@example.com', 'demo-password'])
  // пустой экран тренера дня 15
  expect(timur.urlAfter).toBe(`${BASE}/clients`)
  expect(timur.after).toContain('Подопечных пока нет')
  expect(timur.after.slice(0, 4)).toEqual(['Подопечные', 'Программы', 'Отчёт', 'Выйти'])
  expect(run('timur-db').code).toBe(0)
  expect(out('timur-db')).toMatch(/^ Тимур +\| coach$/m)
  expect(out('timur-db')).toMatch(/^ Полина +\| client$/m)

  // замечания в одно место: пишет вошедший, читает только владелец базы; страницу подставляет ссылка в меню
  expect(agent('ask-report')).toMatchObject({
    prompt:
      'Замечания — в одно место: «Сообщить о проблеме» в меню, форма — что делали, что ожидали, что вышло, страница сама; ' +
      'строка в таблице feedback, читает только владелец базы',
    steps: ['fb-sql', 'fb-apply', 'fb-page', 'fb-action', 'fb-link', 'fb-nav'],
  })
  const fbSql = file('fb-sql')
  expect(fbSql).toMatchObject({ path: 'supabase/migrations/0015_feedback.sql', before: null })
  for (const part of ['create table feedback (', 'author_id uuid not null default auth.uid() references profiles (id)', 'alter table feedback enable row level security;', 'for insert to authenticated with check (author_id = auth.uid());', 'revoke all on feedback from anon, authenticated;', 'grant insert (page, did, expected, got) on feedback to authenticated;']) {
    expect(fbSql.after, part).toContain(part)
  }
  // политики на чтение нет — замечания читает только владелец базы
  expect(fbSql.after).not.toMatch(/for select|grant select/)
  expect(run('fb-apply')).toMatchObject({ cmd: 'psql -f supabase/migrations/0015_feedback.sql', code: 0, out: ['CREATE TABLE', 'ALTER TABLE', 'CREATE POLICY', 'REVOKE', 'GRANT'] })
  expect(file('fb-page')).toMatchObject({ path: 'app/problem/page.tsx', before: null })
  for (const part of ['["did", "Что делали"]', '["expected", "Что ожидали"]', '["got", "Что вышло"]', 'defaultValue={typeof page === "string" ? page : ""}', 'Спасибо, замечание записано.']) {
    expect(file('fb-page').after, part).toContain(part)
  }
  expect(file('fb-action')).toMatchObject({ path: 'app/problem/actions.ts', before: null })
  expect(file('fb-action').after).toContain('"insert into feedback (page, did, expected, got) values ($1, $2, $3, $4)"')
  expect(file('fb-link')).toMatchObject({ path: 'components/ProblemLink.tsx', before: null })
  expect(file('fb-link').after).toContain('usePathname()')
  expect(file('fb-link').after).toContain('query: pathname === "/problem" ? {} : { page: pathname }')
  expect(file('fb-nav')).toMatchObject({ path: 'components/Nav.tsx' })
  expect(file('fb-nav').after).toContain('<ProblemLink />')
  // человек: сквозной тест s20 сверяет ссылки меню — в нём новый пункт
  expect(file('fb-e2e')).toMatchObject({ path: 'e2e/first-run.spec.ts' })
  expect(file('fb-e2e').after).toContain('toHaveText(["Подопечные", "Программы", "Отчёт", "Сообщить о проблеме"])')
  expect(file('fb-e2e').after).toContain('toHaveText(["Мои тренировки", "Питание", "Замеры", "Сообщить о проблеме"])')
  expect(commit('c-feedback')).toMatchObject({ message: 'Сообщить о проблеме', branch: 'main', parents: [commit('c-coach-invite').hash] })
  expect(commit('c-feedback').files.map((f) => f.path)).toEqual(
    expect.arrayContaining(['supabase/migrations/0015_feedback.sql', 'app/problem/page.tsx', 'app/problem/actions.ts', 'components/ProblemLink.tsx', 'components/Nav.tsx', 'e2e/first-run.spec.ts', '.gitignore']),
  )
  // перезапуск dev со сбросом кэша, как contrast-restart в s20
  expect(run('dev-restart')).toMatchObject({ code: 0, out: [] })
  expect(run('dev-restart').cmd).toContain("'localhost:3000/__nextjs_restart_dev?invalidateFileSystemCache=1'")

  // Тимур пишет замечание — авторский текст: что делал, что ожидал, что вышло
  const problem = browser('timur-feedback')
  expect(problem.url).toBe(`${BASE}/problem`)
  // в меню — новый пункт
  expect(problem.before.slice(0, 5)).toEqual(['Подопечные', 'Программы', 'Отчёт', 'Сообщить о проблеме', 'Выйти'])
  expect(problem.fields).toEqual([
    { label: 'Страница', value: 'Карточка подопечного' },
    { label: 'Что делали', value: 'Нажал «Отправить» под тренировкой — в поле был один пробел' },
    { label: 'Что ожидали', value: 'Подсказку, что комментарий пустой' },
    { label: 'Что вышло', value: 'Страница обновилась, и всё: ни комментария, ни ошибки' },
  ])
  expect(problem.urlAfter).toBe(`${BASE}/problem?sent=1`)
  expect(problem.after).toContain('Спасибо, замечание записано.')
  // -x: «поле | значение» строкой — каждая строка помещается в 100 знаков окна терминала
  expect(run('fb-db')).toMatchObject({ cmd: 'psql -x -c "select page, did, expected, got from feedback"', code: 0 })
  for (const { value } of problem.fields) expect(out('fb-db'), value).toContain(value)
  expect(run('fb-db').out[0]).toMatch(/^-\[ RECORD 1 \]-+$/)
  expect(out('fb-db')).not.toContain('RECORD 2')
  expect(run('fb-db').out.slice(1).map((line) => line.split(' | ')[0].trim())).toEqual(['page', 'did', 'expected', 'got'])
  for (const line of run('fb-db').out) expect([...line].length, line).toBeLessThanOrEqual(100)

  // сбой, о котором тренер не напишет: /clients/abc — 500 на bigint, страница Next без понятных слов, журнала нет
  const crash = browser('crash')
  expect(crash.url).toBe(`${BASE}/clients/abc`)
  expect(crash.network).toContainEqual({ method: 'GET', url: `${BASE}/clients/abc`, status: 500 })
  expect(crash.after.slice(0, 2)).toEqual(['This page couldn’t load', 'A server error occurred. Reload to try again.'])
  expect(crash.server).toContain('⨯ error: invalid input syntax for type bigint: "abc"')
  expect(run('errors-before')).toMatchObject({ cmd: `psql -At -c "select count(*) from pg_tables where tablename = 'errors'"`, code: 0, out: ['0'] })

  // журнал сбоев: сначала тест — красный, вторым ходом («Делай») таблица, страница ошибки и хук — зелёный
  expect(agent('ask-errors')).toMatchObject({
    prompt: 'О сбое тренер не напишет. Нужна понятная страница ошибки и журнал сбоев в базе. Сначала тест',
    steps: ['err-test', 'err-red'],
  })
  const errTest = file('err-test')
  expect(errTest).toMatchObject({ path: 'test/errors.test.ts', before: null })
  for (const part of ['import { onRequestError } from "../instrumentation";', '{ path: "/clients/abc?week=2026-11-09", method: "GET", headers: {} }', 'expect(rows).toEqual([{ path: "/clients/abc", message: MESSAGE.slice(0, 500) }]);', 'const MESSAGE = `${MARK} ${"x".repeat(600)}`;', 'await pool.query("delete from errors where starts_with(message, $1)", [MARK]);', 'rejects.toThrow("permission denied")']) {
    expect(errTest.after, part).toContain(part)
  }
  const ERR_VITEST = 'npx vitest run test/errors.test.ts'
  expect(run('err-red').cmd).toBe(ERR_VITEST)
  expect(run('err-red').code).not.toBe(0)
  expect(out('err-red')).toContain("Error: Cannot find module '../instrumentation' imported from ~/trainer-app/test/errors.test.ts")
  expect(agent('ask-errors-go')).toMatchObject({ prompt: 'Делай', steps: ['err-sql', 'err-apply', 'err-page', 'err-hook', 'err-pool', 'err-green'] })
  const errSql = file('err-sql')
  expect(errSql).toMatchObject({ path: 'supabase/migrations/0016_errors.sql', before: null })
  for (const part of ['create table errors (', 'path text not null,', 'message text not null check (length(message) <= 500),', 'created_at timestamptz not null default now()', 'alter table errors enable row level security;', 'revoke all on errors from anon, authenticated;']) {
    expect(errSql.after, part).toContain(part)
  }
  expect(run('err-apply')).toMatchObject({ cmd: 'psql -f supabase/migrations/0016_errors.sql', code: 0, out: ['CREATE TABLE', 'ALTER TABLE', 'REVOKE'] })
  const page = file('err-page')
  expect(page).toMatchObject({ path: 'app/error.tsx', before: null })
  expect(page.after).toContain('"use client";')
  expect(page.after).toContain('Что-то пошло не так')
  // ни текста ошибки, ни стектрейса: страница не читает error; «сбой записан» не обещает — ошибки в браузере журнал не видит
  expect(page.after).not.toMatch(/error\.(message|stack|digest)/)
  expect(page.after).toContain('Это ошибка приложения, а не ваша.')
  expect(page.after).not.toMatch(/записан/)
  const hook = file('err-hook')
  expect(hook).toMatchObject({ path: 'instrumentation.ts', before: null })
  for (const part of ['export const onRequestError: Instrumentation.onRequestError = async (error, request) => {', 'if (process.env.NEXT_RUNTIME === "nodejs") {', 'const path = request.path.split("?")[0];', '.slice(0, 500);', '"insert into errors (path, message) values ($1, $2)", [path, message]']) {
    expect(hook.after, part).toContain(part)
  }
  // комментарий lib/db.ts снова верен: мимо asUser — вход, /join и журнал сбоев
  const db = file('err-pool')
  expect(db.path).toBe('lib/db.ts')
  expect(db.before).toContain('Напрямую через pool ходит только вход (app/api/login)')
  expect(db.after).toContain('вход (app/api/login), приглашение и регистрация (app/join) и журнал сбоев (instrumentation.ts)')
  expect(run('err-green')).toMatchObject({ cmd: ERR_VITEST, code: 0 })
  expect(out('err-green')).toMatch(/Tests {2}2 passed \(2\)/)
  expect(at('err-red')).toBeLessThan(at('err-sql'))
  expect(commit('c-errors')).toMatchObject({ message: 'Сбои: понятная страница и журнал', branch: 'main', parents: [commit('c-feedback').hash] })
  expect(commit('c-errors').files.map((f) => f.path)).toEqual(
    expect.arrayContaining(['supabase/migrations/0016_errors.sql', 'app/error.tsx', 'instrumentation.ts', 'test/errors.test.ts', 'lib/db.ts']),
  )

  // тот же сбой после: понятная страница под меню, без текста ошибки; в журнале — путь и сообщение, без времени
  const crash2 = browser('crash2')
  expect(crash2.url).toBe(`${BASE}/clients/abc`)
  expect(crash2.network).toContainEqual({ method: 'GET', url: `${BASE}/clients/abc`, status: 500 })
  expect(crash2.after).toContain('Что-то пошло не так')
  expect(crash2.after).toContain('Это ошибка приложения, а не ваша.')
  expect(crash2.after.slice(0, 5)).toEqual(['Подопечные', 'Программы', 'Отчёт', 'Сообщить о проблеме', 'Выйти'])
  expect(text(crash2.after)).not.toMatch(/bigint|invalid input|\bat /)
  expect(run('errors-db')).toMatchObject({ cmd: 'psql -c "select path, message from errors"', code: 0 })
  expect(run('errors-db').out).toContain(' /clients/abc | invalid input syntax for type bigint: "abc"')
  expect(out('errors-db')).toContain('(1 row)')
  // время журнала в кадр не попадает (Review Focus 2)
  expect(out('errors-db')).not.toMatch(/\d{2}:\d{2}|\d{4}-\d{2}-\d{2}|created_at/)

  // файлов людей, копий базы и отчётов тестов нет ни в одном коммите сессии (Review Focus 3)
  for (const e of events) {
    if (e.kind === 'commit') expect(e.files.filter((f) => /^(public\/uploads|storage|backups|test-results|playwright-report)\//.test(f.path)), e.id).toEqual([])
  }
})

test('s25: «исправь всё» — пять файлов без тестов; три круга — красный, правка, зелёный, коммит с тестом', () => {
  const events = sessions['s25-beta-fixes'].events
  expect(events.map((e) => e.id)).toEqual([
    ...['typegen', 'findings-doc', 'programs-file', 'programs-check', 'c-findings', 'all-branch'],
    ...['ask-all', 'all-join', 'all-rate', 'all-id', 'all-comment', 'all-programs', 'c-all', 'all-stat', 'all-drop'],
    ...['ask-join-fix', 'jf-test', 'jf-red', 'jf-rate', 'jf-code', 'jf-green', 'c-join-fix'],
    ...['ask-id-fix', 'id-test', 'id-red', 'id-code', 'id-workout', 'id-not-found', 'id-green', 'c-id-fix'],
    ...['ask-comment-fix', 'cm-test', 'cm-red', 'cm-action', 'cm-code', 'cm-green', 'c-comment-fix'],
    'fix-log',
  ])
  const run = (id: string) => find('s25-beta-fixes', id, 'run')
  const file = (id: string) => find('s25-beta-fixes', id, 'file')
  const agent = (id: string) => find('s25-beta-fixes', id, 'agent')
  const commit = (id: string) => find('s25-beta-fixes', id, 'commit')
  const at = (id: string) => events.findIndex((e) => e.id === id)
  const out = (id: string) => run(id).out.join('\n')
  // шаги внутри запросов — агента, остальные — человека: замечания, проверка «Подождёт», git
  const asks = ['ask-all', 'ask-join-fix', 'ask-id-fix', 'ask-comment-fix']
  const inner = new Set(asks.flatMap((id) => agent(id).steps))
  for (const e of events) {
    if (e.kind !== 'agent') expect((e as { by?: string }).by, e.id).toBe(inner.has(e.id) ? 'agent' : undefined)
  }
  expect(run('typegen')).toMatchObject({ cmd: 'npx next typegen', code: 0 })

  // замечания беты — человек, по трём стопкам дня 8; в каждом — что делали, что ожидали, что вышло
  const doc = file('findings-doc')
  expect(doc).toMatchObject({ path: 'docs/beta-findings.md', before: null })
  expect(doc.after.split('\n').filter((line) => line.startsWith('## '))).toEqual(['## Портит данные', '## Мешает каждый день', '## Подождёт'])
  const items = doc.after.split('\n').filter((line) => line.startsWith('- '))
  expect(items).toHaveLength(5)
  for (const item of items) for (const part of ['Делали:', 'Ожидали:', 'Вышло:']) expect(item, part).toContain(part)
  const pile = (heading: string) => doc.after.split('## ').find((part) => part.startsWith(heading))!
  expect(pile('Портит данные')).toContain('/join: попыткам нет счёта')
  expect(pile('Портит данные')).toContain('«Эта почта уже зарегистрирована — войдите» и «Приглашение отозвано»')
  expect(pile('Мешает каждый день')).toContain('«Что-то пошло не так»')
  expect(pile('Мешает каждый день')).toContain('`invalid input syntax for type bigint: "abc"`')
  expect(pile('Мешает каждый день')).toContain('ни комментария, ни ошибки (замечание Тимура)')
  expect(pile('Подождёт')).toContain('`psql -f supabase/tests/as-client-program.sql`')
  expect(doc.after).not.toMatch(/Анна|Анн[уыео]/)
  // «Подождёт» повторяет человек: подопечная вставляет программу, в конце откат
  expect(file('programs-file')).toMatchObject({ path: 'supabase/tests/as-client-program.sql', before: null })
  expect(file('programs-file').after).toContain('set local request.jwt.claims = \'{"sub":"33333333-3333-3333-3333-333333333333"}\';')
  expect(run('programs-check')).toMatchObject({ cmd: 'psql -f supabase/tests/as-client-program.sql', code: 0 })
  expect(run('programs-check').out).toContain(' Программа подопечной')
  expect(run('programs-check').out.slice(-2)).toEqual(['INSERT 0 1', 'ROLLBACK'])
  expect(commit('c-findings')).toMatchObject({ message: 'Замечания беты по стопкам', branch: 'main', parents: [find('s24-beta', 'c-errors', 'commit').hash] })

  // подводный камень: «исправь всё» в ветке fix/all — пять файлов агента одним ходом, без тестов и без прогонов
  expect(run('all-branch')).toMatchObject({ cmd: 'git switch -c fix/all', code: 0 })
  expect(agent('ask-all').prompt).toBe('Исправь все замечания из docs/beta-findings.md')
  expect(agent('ask-all').reply).toMatch(/^Исправил все пять/)
  const allSteps = ['all-join', 'all-rate', 'all-id', 'all-comment', 'all-programs']
  expect(agent('ask-all').steps).toEqual(allSteps)
  const touched = allSteps.map((id) => file(id).path)
  expect(touched).toEqual(['app/join/[code]/actions.ts', 'lib/rate-limit.ts', 'app/clients/[id]/page.tsx', 'app/workouts/[id]/comments.ts', 'supabase/migrations/0017_programs_coach.sql'])
  expect(allSteps.map((id) => file(id).before === null)).toEqual([false, false, false, false, true])
  expect(commit('c-all')).toMatchObject({ message: 'Все замечания беты', branch: 'fix/all', parents: [commit('c-findings').hash] })
  expect(run('all-stat')).toMatchObject({ cmd: 'git diff main fix/all --stat', code: 0 })
  const stat = run('all-stat').out.filter(Boolean)
  expect(stat).toHaveLength(6)
  for (const path of touched) expect(stat.some((line) => line.trimStart().startsWith(`${path} `)), path).toBe(true)
  expect(stat[5]).toContain('5 files changed')
  // ни одного теста: путей test/ и e2e/ в диффе нет
  expect(stat.filter((line) => /(^|\s)(test|e2e)\//.test(line))).toEqual([])
  expect(run('all-drop')).toMatchObject({ cmd: 'git switch main && git branch -D fix/all', code: 0 })
  expect(out('all-drop')).toContain('Deleted branch fix/all')

  // три круга: тест повторяет беду — красный на настоящем поведении; правка кода, тест не трогаем; зелёный; коммит — тест и код
  const circles = [
    { ask: 'ask-join-fix', test: 'jf-test', red: 'jf-red', code: ['jf-rate', 'jf-code'], green: 'jf-green', spec: 'e2e/join-limit.spec.ts', commit: 'c-join-fix' },
    { ask: 'ask-id-fix', test: 'id-test', red: 'id-red', code: ['id-code', 'id-workout', 'id-not-found'], green: 'id-green', spec: 'e2e/not-found.spec.ts', commit: 'c-id-fix' },
    { ask: 'ask-comment-fix', test: 'cm-test', red: 'cm-red', code: ['cm-action', 'cm-code'], green: 'cm-green', spec: 'e2e/empty-comment.spec.ts', commit: 'c-comment-fix' },
  ]
  for (const c of circles) {
    expect(agent(c.ask).steps, c.ask).toEqual([c.test, c.red, ...c.code, c.green])
    expect(file(c.test), c.test).toMatchObject({ path: c.spec, before: null })
    const cmd = `npx playwright test ${c.spec}`
    expect(run(c.red), c.red).toMatchObject({ cmd })
    expect(run(c.red).code, c.red).not.toBe(0)
    expect(run(c.green), c.green).toMatchObject({ cmd, code: 0 })
    // тест после красного прогона не меняется: его файл пишет только шаг теста, правки кода — после красного
    expect(events.filter((e) => e.kind === 'file' && e.path === c.spec).map((e) => e.id), c.spec).toEqual([c.test])
    for (const id of c.code) {
      expect(at(id), id).toBeGreaterThan(at(c.red))
      expect(file(id).path, id).not.toMatch(/^(test|e2e)\//)
    }
    // в коммите — тот самый тест, что был красным
    expect(commit(c.commit).files.find((f) => f.path === c.spec)?.blob, c.commit).toBe(file(c.test).blob)
  }
  expect(commit('c-join-fix')).toMatchObject({ message: '/join: один ответ и лимит попыток', branch: 'main', parents: [commit('c-findings').hash] })
  expect(commit('c-id-fix')).toMatchObject({ message: 'Нечисловой номер — «не найдено»', branch: 'main', parents: [commit('c-join-fix').hash] })
  expect(commit('c-comment-fix')).toMatchObject({ message: 'Пустой комментарий — понятная ошибка', branch: 'main', parents: [commit('c-id-fix').hash] })

  // /join: красный — на отказ приглашения ответ другой, шестая попытка проходит — и по одной, и шесть разом
  expect(out('jf-red')).toContain('Expected: "Эта почта уже зарегистрирована — войдите"\n    Received: "Приглашение отозвано"')
  expect(out('jf-red')).toContain('Expected: "Слишком много попыток, подождите 15 минут"\n    Received: "Эта почта уже зарегистрирована — войдите"')
  expect(out('jf-red')).toContain('Expected: 1\n    Received: 0')
  expect(out('jf-red')).toMatch(/^ {2}3 failed$/m)
  const joinSpec = file('jf-test').after
  for (const part of ['const SAME = "Проверьте почту или войдите, если аккаунт уже есть";', 'const TOO_MANY = "Слишком много попыток, подождите 15 минут";', '"update invites set revoked_at = now() where code = $1"', 'for (let attempt = 1; attempt <= 5; attempt++) {', 'test("шесть попыток разом — одна из них «Слишком много попыток»"', 'const answers = await Promise.all(pages.map(send));', '"delete from invites where code = any($1)"']) {
    expect(joinSpec, part).toContain(part)
  }
  // своё подключение к базе: общий pool приложения тест не закрывает
  expect(joinSpec).toContain('const db = new Pool({ connectionString: process.env.DATABASE_URL });')
  expect(joinSpec).not.toContain('../lib/db')
  // ограничитель: ключ — почта входа или код приглашения; попытка засчитывается за один шаг с проверкой
  const limiter = file('jf-rate')
  expect(limiter.path).toBe('lib/rate-limit.ts')
  expect(limiter.before).toContain('по одной почте')
  for (const part of ['регистрация по приглашению (app/join/[code]/actions.ts) — попытки по коду приглашения, ключ join:<код>', 'export function tooManyAttempts(key: string): boolean {', 'export function recordFailure(key: string): void {', 'export function takeAttempt(key: string): boolean {']) {
    expect(limiter.after, part).toContain(part)
  }
  expect(limiter.after).not.toMatch(/\bemail\b/)
  const join = file('jf-code')
  expect(join.path).toBe('app/join/[code]/actions.ts')
  expect(join.before).toContain('const TAKEN = "Эта почта уже зарегистрирована — войдите";')
  expect(join.after).toContain('const SAME = "Проверьте почту или войдите, если аккаунт уже есть";')
  expect(join.after).not.toContain('уже зарегистрирована')
  // честно о цене одного ответа: с действующим приглашением он всё равно значит «почта занята»
  expect(join.after).toContain('С действующим приглашением этот ответ всё равно значит «почта занята»')
  // сначала приглашение, потом почта: на недействующий код — тот же ответ без поиска почты; попытка — за один шаг с проверкой
  const inviteCheck = join.after.indexOf('"select 1 from invites where code = $1 and accepted_by is null and revoked_at is null and expires_at > now()"')
  const emailCheck = join.after.indexOf('"select 1 from auth.users where lower(email) = lower($1)"')
  const limit = join.after.indexOf('if (!takeAttempt(`join:${code}`)) back(TOO_MANY);')
  expect(inviteCheck).toBeGreaterThan(0)
  expect(join.after).toContain('if (invite.rows.length === 0) back(SAME);')
  expect(limit).toBeGreaterThan(inviteCheck)
  expect(emailCheck).toBeGreaterThan(limit)
  expect(join.after).toContain('import { takeAttempt } from "@/lib/rate-limit";')
  expect(out('jf-green')).toMatch(/^ {2}3 passed \(/m)

  // нечисловой номер: красный — «Что-то пошло не так» вместо «Подопечный не найден», у тренировки — 500
  expect(out('id-red')).toContain('Expected: "Подопечный не найден"\n    Received: "Что-то пошло не так"')
  expect(out('id-red')).toContain('Expected: 404\n    Received: 500')
  expect(out('id-red')).toMatch(/^ {2}2 failed$/m)
  expect(file('id-code').path).toBe('app/clients/[id]/page.tsx')
  expect(file('id-workout').path).toBe('app/workouts/[id]/page.tsx')
  for (const id of ['id-code', 'id-workout']) expect(file(id).after, id).toContain('if (!/^\\d{1,18}$/.test(id)) notFound();')
  // у тренировки — своя страница «не найдено» по-русски, как у карточки
  expect(file('id-not-found')).toMatchObject({ path: 'app/workouts/[id]/not-found.tsx', before: null })
  expect(file('id-not-found').after).toContain('Тренировка не найдена')
  expect(file('id-test').after).toContain('toHaveText("Тренировка не найдена")')
  expect(out('id-green')).toMatch(/^ {2}2 passed \(/m)

  // пустой комментарий: красный — под полем ничего; после — действие возвращает ошибку, форма показывает её под полем
  expect(out('cm-red')).toContain('Expected: "Комментарий пустой — напишите текст"')
  expect(out('cm-red')).toContain('Error: element(s) not found')
  expect(out('cm-red')).toMatch(/^ {2}1 failed$/m)
  expect(file('cm-action').path).toBe('app/workouts/[id]/comments.ts')
  expect(file('cm-action').before).toContain('if (body === "" || body.length > 1000) return;')
  expect(file('cm-action').after).toContain('if (body === "") return "Комментарий пустой — напишите текст";')
  expect(file('cm-code').path).toBe('components/Comments.tsx')
  for (const part of ['"use client";', 'const [error, send] = useActionState(action, null);', '<p id={errorId} role="alert" className="text-red-600">']) {
    expect(file('cm-code').after, part).toContain(part)
  }
  expect(out('cm-green')).toMatch(/^ {2}1 passed \(/m)

  // три коммита — в каждом тест (e2e/) и код
  expect(run('fix-log')).toMatchObject({ cmd: 'git log --stat --oneline -3', code: 0 })
  const blocks: { head: string; paths: string[] }[] = []
  for (const line of run('fix-log').out) {
    if (/^[0-9a-f]{7} /.test(line)) blocks.push({ head: line, paths: [] })
    else if (line.includes(' | ')) blocks.at(-1)!.paths.push(line.split(' | ')[0].trim())
  }
  expect(blocks.map((b) => b.head)).toEqual(
    ['c-comment-fix', 'c-id-fix', 'c-join-fix'].map((id) => `${commit(id).hash} ${commit(id).message}`),
  )
  expect(blocks.map((b) => b.paths)).toEqual([
    ['app/workouts/[id]/comments.ts', 'components/Comments.tsx', 'e2e/empty-comment.spec.ts'],
    ['app/clients/[id]/page.tsx', 'app/workouts/[id]/not-found.tsx', 'app/workouts/[id]/page.tsx', 'e2e/not-found.spec.ts'],
    ['app/join/[code]/actions.ts', 'e2e/join-limit.spec.ts', 'lib/rate-limit.ts'],
  ])
  for (const b of blocks) {
    expect(b.paths.some((p) => /^(e2e|test)\//.test(p)), b.head).toBe(true)
    expect(b.paths.some((p) => !/^(e2e|test)\//.test(p)), b.head).toBe(true)
  }

  // ветка «исправь всё» не влита: её миграции нет ни в одном коммите main; файлов людей и отчётов тестов — тоже (Review Focus 3)
  for (const e of events) {
    if (e.kind !== 'commit' || e.branch !== 'main') continue
    expect(e.files.map((f) => f.path), e.id).not.toContain('supabase/migrations/0017_programs_coach.sql')
    expect(e.files.filter((f) => /^(public\/uploads|storage|backups|test-results|playwright-report)\//.test(f.path)), e.id).toEqual([])
    expect(e.files.map((f) => f.path), e.id).not.toContain('supabase/tests/beta-invites.sql')
  }
})
