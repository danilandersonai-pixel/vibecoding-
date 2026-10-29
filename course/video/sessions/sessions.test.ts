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
