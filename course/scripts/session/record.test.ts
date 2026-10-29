// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { gitBlobHash } from '../../video/sessions/blob'
import { sessionProblems } from '../../video/sessions/check'
import { makeFind } from '../../video/sessions/types'
import type { CommitEvent, SessionRecord } from '../../video/sessions/types'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { limitText, packState, RUN_LIMIT_MS, recordChain, unpackState } from './record.mjs'

const LONG = 120_000
vi.setConfig({ testTimeout: LONG, hookTimeout: LONG })
const made: string[] = []
const fresh = () => {
  const dir = mkdtempSync(join(tmpdir(), 'rec-'))
  made.push(dir)
  return dir
}
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true })
})

const hashes = (r: SessionRecord) => r.events.filter((e): e is CommitEvent => e.kind === 'commit').map((e) => e.hash)
// Строка для `bash -c`: в одинарных кавычках, одиночные кавычки внутри экранируются.
const sh = (s: string) => `'${s.replaceAll("'", `'\\''`)}'`

// Учебный «сервер»: страница с полем «Вес» и кнопкой; по нажатию /api отвечает 400.
const PAGE =
  '<!doctype html><meta charset=utf-8><title>Тренер</title>' +
  '<div><label for=w>Вес</label> <input id=w></div><div><button id=b>Сохранить</button></div><p id=r></p>' +
  "<script>b.onclick=async()=>{const x=await fetch('/api');r.textContent='Ответ '+x.status+': '+await x.text()}</script>"
// Программа сервера для `node -e`: страница на любой адрес, кроме /api — его обрабатывает api (по умолчанию отвечает 400).
const serverOf = (page: string, api = "s.statusCode=400;s.end('вес не число')") =>
  `const html=${JSON.stringify(page)};` +
  "require('http').createServer((q,s)=>{console.log(q.method+' '+q.url);" +
  `if(q.url==='/api'){${api}}else{s.setHeader('content-type','text/html;charset=utf-8');s.end(html)}})` +
  ".listen(3000,()=>console.log('Ready'))"
const SERVER = serverOf(PAGE)

// Порт 3000 свободен: к нему не подключиться.
const portFree = () =>
  new Promise<boolean>((resolve) => {
    const socket = connect(3000, '127.0.0.1')
    socket.once('connect', () => (socket.destroy(), resolve(false)))
    socket.once('error', () => resolve(true))
  })

const f01 = () => ({
  id: 'f01',
  from: null,
  date: '2026-10-28T10:00:00Z',
  steps: [
    { id: 'init', run: 'git init -b main' },
    { id: 'file', write: 'a.txt', content: 'один\nтри\n' },
    { id: 'c1', commit: 'один' },
    { id: 'look', read: 'a.txt' },
    { id: 'cat', run: 'cat nope.txt' },
    {
      id: 'ask',
      agent: { prompt: 'В файле a.txt вместо «три» должно быть «два»', reply: 'Поправил.' },
      steps: [{ id: 'fix', edit: 'a.txt', find: 'три', replace: 'два' }],
    },
    { id: 'c2', commit: 'два' },
  ],
})
const f02 = () => ({
  id: 'f02',
  from: 'f01',
  date: '2026-10-28T11:00:00Z',
  steps: [
    { id: 'dev', run: `node -e ${sh(SERVER)}`, until: 'Ready' },
    { id: 'save', browser: { url: '/', fill: { Вес: '60 кг' }, click: 'Сохранить' } },
  ],
})
const chain = () => [f01(), f02()]

describe('recordChain: учебная цепочка из двух сессий', () => {
  let records: SessionRecord[]
  let again: SessionRecord[]
  let project: string
  let find: ReturnType<typeof makeFind>

  beforeAll(async () => {
    const first = await recordChain(chain(), { workdir: fresh() })
    records = first.records
    project = first.project
    find = makeFind(records)
    again = (await recordChain(chain(), { workdir: fresh() })).records
  }, LONG)

  it('запись сходится с проверкой сессий', () => {
    expect(sessionProblems(records)).toEqual([])
    expect(records.map((r) => [r.id, r.from, r.recorded])).toEqual([
      ['f01', null, '2026-10-28'],
      ['f02', 'f01', '2026-10-28'],
    ])
  })

  it('run: вывод с путём ~, код выхода, stderr в общем потоке', () => {
    const init = find('f01', 'init', 'run')
    expect(init.out[0]).toBe('Initialized empty Git repository in ~/trainer-app/.git/')
    expect(init).toMatchObject({ cmd: 'git init -b main', cwd: '~/trainer-app', code: 0 })
    const cat = find('f01', 'cat', 'run')
    expect(cat.code).not.toBe(0)
    expect(cat.out).toEqual(['cat: nope.txt: No such file or directory'])
  })

  it('write/read/edit: до, после, дифф и хеши', () => {
    const file = find('f01', 'file', 'file')
    expect(file).toMatchObject({ path: 'a.txt', before: null, after: 'один\nтри\n', blob: gitBlobHash('один\nтри\n') })
    expect(file.diff.slice(-3)).toEqual(['@@ -0,0 +1,2 @@', '+один', '+три'])
    expect(find('f01', 'look', 'read')).toMatchObject({ path: 'a.txt', text: 'один\nтри\n', blob: gitBlobHash('один\nтри\n') })
    const fix = find('f01', 'fix', 'file')
    expect(fix.by).toBe('agent')
    expect(fix.before).toBe('один\nтри\n')
    expect(fix.after).toBe('один\nдва\n')
    expect(fix.diff).toContain('-три')
    expect(fix.diff).toContain('+два')
    expect(find('f01', 'file', 'file').by).toBeUndefined()
  })

  it('commit: хеш из 7 знаков, ветка, родители, файлы, дата сессии + k минут', () => {
    const c1 = find('f01', 'c1', 'commit')
    const c2 = find('f01', 'c2', 'commit')
    expect(c1.cmd).toBe('git add -A && git commit -m "один"')
    expect(c1).toMatchObject({ message: 'один', branch: 'main', parents: [], files: [{ path: 'a.txt', blob: gitBlobHash('один\nтри\n') }] })
    expect(c1.hash).toMatch(/^[0-9a-f]{7}$/)
    expect(c1.out[0]).toBe(`[main (root-commit) ${c1.hash}] один`)
    expect(c2).toMatchObject({ message: 'два', parents: [c1.hash], files: [{ path: 'a.txt', blob: gitBlobHash('один\nдва\n') }] })
    expect(find('f01', 'c2', 'commit').by).toBeUndefined()

    const log = execFileSync('git', ['log', '--reverse', '--format=%an|%ae|%cn|%ce|%aI|%cI'], { cwd: project, encoding: 'utf8' })
    expect(log.trim().split('\n')).toEqual([
      'Анна|anna@example.com|Анна|anna@example.com|2026-10-28T10:01:00+00:00|2026-10-28T10:01:00+00:00',
      'Анна|anna@example.com|Анна|anna@example.com|2026-10-28T10:02:00+00:00|2026-10-28T10:02:00+00:00',
    ])
  })

  it('agent: событие стоит перед своими шагами и ссылается на них', () => {
    const events = records[0].events.map((e) => e.id)
    expect(events.indexOf('ask')).toBe(events.indexOf('fix') - 1)
    expect(find('f01', 'ask', 'agent')).toMatchObject({ prompt: 'В файле a.txt вместо «три» должно быть «два»', reply: 'Поправил.', steps: ['fix'] })
  })

  it('run с until: ждёт строку, оставляет сервер; код null', () => {
    const dev = find('f02', 'dev', 'run')
    expect(dev.code).toBeNull()
    expect(dev.out).toEqual(['Ready'])
  })

  it('browser: поля, кнопки, текст до и после, консоль, сеть, сервер', () => {
    const save = find('f02', 'save', 'browser')
    expect(save).toMatchObject({ url: 'http://localhost:3000/', title: 'Тренер' })
    expect(save.fields).toEqual([{ label: 'Вес', value: '60 кг' }])
    expect(save.buttons).toEqual(['Сохранить'])
    expect(save.before).toEqual(['Вес', 'Сохранить'])
    expect(save.after).toEqual(['Вес', 'Сохранить', 'Ответ 400: вес не число'])
    expect(save.network).toContainEqual(expect.objectContaining({ method: 'GET', status: 400, url: 'http://localhost:3000/api' }))
    expect(save.console.some((m) => m.type === 'error')).toBe(true)
    expect(save.server).toContain('GET /api')
    expect(save.server).not.toContain('Ready')
    expect(save).not.toHaveProperty('urlAfter') // нажатие обошлось без перехода
  })

  it('повтор той же цепочки в другой папке даёт те же хеши коммитов и те же записи', () => {
    expect(hashes(again[0])).toHaveLength(2)
    expect(again.map(hashes)).toEqual(records.map(hashes))
    expect(sessionProblems(again)).toEqual([])
    // записи браузера не сравниваем: порядок консоли и сети у параллельных запросов не гарантирован; остальное от папки не зависит
    const strip = (rs: SessionRecord[]) => rs.map((r) => ({ ...r, events: r.events.filter((e) => e.kind !== 'browser') }))
    expect(strip(again)).toEqual(strip(records))
  })

  it('сервер сессии остановлен вместе с группой процессов: порт 3000 свободен', async () => {
    expect(await portFree()).toBe(true)
  })
})

describe('recordChain: вывод команд', () => {
  const one = (steps: object[]) => ({ id: 'x01', from: null, date: '2026-10-28T10:00:00Z', steps })
  const outOf = async (steps: object[]) => {
    const { records } = await recordChain([one(steps)], { workdir: fresh() })
    return records[0].events
  }

  it('убирает ANSI, заменяет путь home на ~, не обрезает строки справа, отбрасывает пустые строки в конце', async () => {
    const events = await outOf([
      { id: 'a', run: "printf '\\033[31mкрасный\\033[0m\\n'" },
      { id: 'b', run: 'echo "$HOME"; pwd' },
      { id: 'c', run: 'pwd', cwd: '~' },
      { id: 'd', run: "printf 'x  \\n\\n  y\\n\\n\\n'" },
    ])
    expect(events.map((e) => (e.kind === 'run' ? [e.cwd, e.out] : null))).toEqual([
      ['~/trainer-app', ['красный']],
      ['~/trainer-app', ['~', '~/trainer-app']],
      ['~', ['~']],
      ['~/trainer-app', ['x  ', '', '  y']],
    ])
  })

  it('stderr и stdout идут в порядке появления, и в составной команде тоже', async () => {
    const events = await outOf([
      { id: 'a', run: 'echo a; echo b >&2; echo c' },
      { id: 'b', run: 'echo one >&2 && echo two; exit 3' },
    ])
    expect(events.map((e) => (e.kind === 'run' ? [e.out, e.code] : null))).toEqual([
      [['a', 'b', 'c'], 0],
      [['one', 'two'], 3],
    ])
  })

  it('окружение: имя, почта, порт, цвет, ~ как home, настройки пользователя не просачиваются', async () => {
    const [e, home] = await outOf([
      { id: 'a', run: 'echo $GIT_AUTHOR_NAME $GIT_COMMITTER_EMAIL $PORT $FORCE_COLOR $NEXT_TELEMETRY_DISABLED $npm_config_fund $npm_config_update_notifier' },
      { id: 'b', run: 'echo $HOME $XDG_CONFIG_HOME; ls -A ~' },
    ])
    expect(e).toMatchObject({ out: ['Анна anna@example.com 3000 0 1 false false'] })
    expect(home).toMatchObject({ out: ['~ ~/.config', 'trainer-app'] })
  })

  it('локаль и пояс заданы: чужие LC_ALL и TZ не влияют, русский текст в UTF-8 сохраняется', async () => {
    const saved = { LC_ALL: process.env.LC_ALL, TZ: process.env.TZ, LANGUAGE: process.env.LANGUAGE }
    Object.assign(process.env, { LC_ALL: 'C', TZ: 'Asia/Tokyo', LANGUAGE: 'ru' })
    try {
      const events = await outOf([
        { id: 'init', run: 'git init -q -b main' },
        { id: 'a', write: 'a.txt', content: 'один\n' },
        { id: 'c', commit: 'один' },
        { id: 'env', run: 'echo $LC_ALL $TZ [$LANGUAGE]; date -d @0 +%H:%Z; locale charmap; cat a.txt' },
        { id: 'log', run: 'git log -1 --format=%ad --date=iso' },
      ])
      const [, , commit, env, log] = events
      expect(commit).toMatchObject({ kind: 'commit', out: expect.arrayContaining([expect.stringMatching(/\] один$/)]) })
      expect(env).toMatchObject({ out: ['C.UTF-8 UTC []', '00:UTC', 'UTF-8', 'один'] })
      expect(log).toMatchObject({ out: ['2026-10-28 10:01:00 +0000'] })
    } finally {
      for (const [name, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[name]
        else process.env[name] = value
      }
    }
  })

  it('npmCache попадает в npm_config_cache', async () => {
    const dir = fresh()
    const { records } = await recordChain([one([{ id: 'a', run: 'echo $npm_config_cache' }])], { workdir: dir, npmCache: '/cache/npm' })
    expect(records[0].events[0]).toMatchObject({ out: ['/cache/npm'] })
  })

  it('с npmCache журнал npm всё равно в ~/.npm/_logs, как у человека, а не в папке кэша', async () => {
    const cache = fresh()
    const { records } = await recordChain(
      [
        one([
          { id: 'pkg', write: 'package.json', content: '{ "name": "x", "version": "1.0.0", "scripts": { "dev": "echo dev" } }\n' },
          { id: 'nope', run: 'npm run start-dev' },
        ]),
      ],
      { workdir: fresh(), npmCache: cache },
    )
    const run = records[0].events[1]
    expect(run).toMatchObject({ kind: 'run', code: 1 })
    const out = run.kind === 'run' ? run.out.join('\n') : ''
    expect(out).toMatch(/A complete log of this run can be found in: ~\/\.npm\/_logs\/\S+-debug-0\.log/)
    expect(out).not.toContain(cache)
  })

  it('метки ИИ-агента, из которого запущен рекордер, в команды не попадают', async () => {
    // по таким меткам `next dev` понимает, что его запустил агент, и дописывает в проект AGENTS.md
    const marks = {
      AI_AGENT: 'claude-code',
      CLAUDECODE: '1',
      CLAUDE_CODE_ENTRYPOINT: 'cli',
      CODEX_SANDBOX: 'seatbelt',
      CURSOR_AGENT: '1',
      COPILOT_MODEL: 'gpt',
      GEMINI_CLI: '1',
      OPENCODE_CLIENT: 'cli',
      AUGMENT_AGENT: '1',
      ANTIGRAVITY_AGENT: '1',
      REPL_ID: 'repl',
    }
    const saved = Object.fromEntries(Object.keys(marks).map((name) => [name, process.env[name]]))
    Object.assign(process.env, marks)
    try {
      // и все метки из шаблона рекордера, в том числе настоящие CLAUDE_* запустившего тесты
      const pattern = '^(AI_AGENT|CLAUDE|CODEX_|CURSOR_|COPILOT_|GEMINI_CLI|OPENCODE_|AUGMENT_AGENT|ANTIGRAVITY_AGENT|REPL_ID)'
      const [e] = await outOf([{ id: 'env', run: `env | cut -d= -f1 | grep -E "${pattern}" | sort; echo конец` }])
      expect(e).toMatchObject({ out: ['конец'] })
    } finally {
      for (const [name, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[name]
        else process.env[name] = value
      }
    }
  })
})

describe('recordChain: браузер', () => {
  const session = (steps: object[]) => ({ id: 'b01', from: null, date: '2026-10-28T10:00:00Z', steps })
  const browserOf = async (page: string, browser: object, api?: string) => {
    const dev = { id: 'dev', run: `node -e ${sh(serverOf(page, api))}`, until: 'Ready' }
    const { records } = await recordChain([session([dev, { id: 'b', browser }])], { workdir: fresh() })
    return makeFind(records)('b01', 'b', 'browser')
  }

  // Поле, которое при вводе меняет текст страницы, и четыре кнопки: две видимые, одна скрыта, одна без текста.
  const FORM =
    '<!doctype html><meta charset=utf-8><title>Тренер</title>' +
    '<div><label for=w>Вес</label> <input id=w oninput="o.textContent=\'Ввод: \'+this.value"></div><p id=o></p>' +
    '<div><button>  Сохранить </button></div><div><button>Очистить</button></div><div><button hidden>Скрытая</button></div><div><button> </button></div>'

  it('buttons — все видимые кнопки страницы по порядку, а не только нажатые', async () => {
    const event = await browserOf(FORM, { url: '/', fill: { Вес: '60 кг' }, click: 'Сохранить' })
    expect(event.buttons).toEqual(['Сохранить', 'Очистить'])
    const idle = await browserOf(FORM, { url: '/' })
    expect(idle).toMatchObject({ fields: [], buttons: ['Сохранить', 'Очистить'], before: ['Вес', 'Сохранить', 'Очистить'] })
  })

  it('before — текст страницы после заполнения полей, прямо перед нажатием', async () => {
    const event = await browserOf(FORM, { url: '/', fill: { Вес: '60 кг' }, click: 'Очистить' })
    expect(event.fields).toEqual([{ label: 'Вес', value: '60 кг' }])
    expect(event.before).toEqual(['Вес', 'Ввод: 60 кг', 'Сохранить', 'Очистить'])
  })

  it('после нажатия ждёт ответа на запрос, который обработчик отправляет не сразу', async () => {
    const page =
      '<!doctype html><meta charset=utf-8><title>Тренер</title><button id=b>Сохранить</button><p id=r></p>' +
      "<script>b.onclick=()=>setTimeout(async()=>{const x=await fetch('/api');r.textContent=await x.text()},100)</script>"
    // сервер отвечает через 300 мс
    const event = await browserOf(page, { url: '/', click: 'Сохранить' }, "setTimeout(()=>s.end('сохранено'),300)")
    expect(event.before).toEqual(['Сохранить'])
    expect(event.after).toEqual(['Сохранить', 'сохранено'])
  })

  it('urlAfter — адрес после перехода по нажатию; без перехода поля нет', async () => {
    // кнопка формы уходит на /done; страница печатает свой путь
    const page =
      '<!doctype html><meta charset=utf-8><title>Тренер</title><form method=post action=/done><button>Дальше</button></form><p id=r></p>' +
      '<script>r.textContent=location.pathname</script>'
    const event = await browserOf(page, { url: '/', click: 'Дальше' })
    expect(event).toMatchObject({ url: 'http://localhost:3000/', urlAfter: 'http://localhost:3000/done', before: ['Дальше', '/'], after: ['Дальше', '/done'] })
    expect(await browserOf(page, { url: '/' })).not.toHaveProperty('urlAfter')
  })

  it('страница открылась не по запрошенному адресу (перенаправление) — ошибка шага с обоими адресами', async () => {
    // /start перенаправляет на /done; остальные адреса отвечают страницей с путём
    const server =
      "require('http').createServer((q,s)=>{console.log(q.method+' '+q.url);" +
      "if(q.url==='/start'){s.statusCode=302;s.setHeader('location','/done');s.end()}" +
      "else{s.setHeader('content-type','text/html;charset=utf-8');s.end('<!doctype html><meta charset=utf-8><title>Тренер</title><p>'+q.url+'</p>')}})" +
      ".listen(3000,()=>console.log('Ready'))"
    const dev = { id: 'dev', run: `node -e ${sh(server)}`, until: 'Ready' }
    await expect(recordChain([session([dev, { id: 'b', browser: { url: '/start' } }])], { workdir: fresh() })).rejects.toThrow(
      'Сессия «b01», шаг «b»: страница открылась по адресу http://localhost:3000/done, а запрошен http://localhost:3000/start — укажите в шаге конечный адрес',
    )
    expect(await portFree()).toBe(true) // сервер после ошибки остановлен
    // с конечным адресом в шаге всё записывается, urlAfter нет; адрес с русскими буквами браузер кодирует, но это тот же адрес
    const { records } = await recordChain([session([dev, { id: 'b', browser: { url: '/done' } }, { id: 'ru', browser: { url: '/путь' } }])], { workdir: fresh() })
    const find = makeFind(records)
    expect(find('b01', 'b', 'browser')).toMatchObject({ url: 'http://localhost:3000/done', before: ['/done'] })
    expect(find('b01', 'b', 'browser')).not.toHaveProperty('urlAfter')
    expect(find('b01', 'ru', 'browser')).not.toHaveProperty('urlAfter')
  })

  it('браузер: локаль ru-RU и пояс Europe/Moscow', async () => {
    const page =
      '<!doctype html><meta charset=utf-8><title>Тренер</title><p id=l></p><p id=z></p>' +
      '<script>l.textContent=navigator.language;z.textContent=Intl.DateTimeFormat().resolvedOptions().timeZone</script>'
    const event = await browserOf(page, { url: '/' })
    expect(event.before).toEqual(['ru-RU', 'Europe/Moscow'])
  })

  it('cookie живёт между шагами браузера одной сессии и не переходит в следующую', async () => {
    // /set ставит cookie who=anna; страницы печатают, какие cookie пришли
    const cookies =
      "require('http').createServer((q,s)=>{console.log(q.method+' '+q.url);" +
      "if(q.url==='/set')s.setHeader('set-cookie','who=anna; Path=/');" +
      "s.setHeader('content-type','text/html;charset=utf-8');" +
      "s.end('<!doctype html><meta charset=utf-8><title>Куки</title><p>'+(q.headers.cookie||'нет cookie')+'</p>')})" +
      ".listen(3000,()=>console.log('Ready'))"
    const dev = { id: 'dev', run: `node -e ${sh(cookies)}`, until: 'Ready' }
    const { records } = await recordChain(
      [
        session([dev, { id: 'set', browser: { url: '/set' } }, { id: 'see', browser: { url: '/' } }]),
        { id: 'b02', from: 'b01', date: '2026-10-28T11:00:00Z', steps: [dev, { id: 'again', browser: { url: '/' } }] },
      ],
      { workdir: fresh() },
    )
    const find = makeFind(records)
    expect(find('b01', 'set', 'browser').before).toEqual(['нет cookie'])
    expect(find('b01', 'see', 'browser').before).toEqual(['who=anna'])
    expect(find('b02', 'again', 'browser').before).toEqual(['нет cookie'])
  })
})

describe('recordChain: потолок обычной команды', () => {
  const one = (steps: object[]) => ({ id: 'x01', from: null, date: '2026-10-28T10:00:00Z', steps })

  it('потолок по умолчанию — 15 минут; текст про срок склоняется', () => {
    expect(limitText(RUN_LIMIT_MS)).toBe('15 минут')
    expect([1, 2, 5, 11, 21].map((m) => limitText(m * 60_000))).toEqual(['1 минуту', '2 минуты', '5 минут', '11 минут', '21 минуту'])
    expect([limitText(2000), limitText(1500)]).toEqual(['2 с', '1,5 с'])
  })

  it('не уложившаяся команда останавливается вместе с группой, ошибка называет сессию и шаг', async () => {
    const workdir = fresh()
    const steps = [{ id: 'slow', run: '(sleep 2; echo late > ~/late.txt) & wait' }]
    await expect(recordChain([one(steps)], { workdir, runLimitMs: 1000 })).rejects.toThrow(/Сессия «x01», шаг «slow»: команда не завершилась за 1 с/)
    await new Promise((done) => setTimeout(done, 2500))
    expect(existsSync(join(workdir, 'home', 'late.txt'))).toBe(false) // потомок из той же группы не дожил до записи
  })

  it('команда, уложившаяся в потолок, записывается как обычно', async () => {
    const { records } = await recordChain([one([{ id: 'ok', run: 'echo привет; exit 2' }])], { workdir: fresh(), runLimitMs: 5000 })
    expect(records[0].events[0]).toMatchObject({ out: ['привет'], code: 2 })
  })
})

describe('recordChain: правки файлов', () => {
  const one = (steps: object[]) => ({ id: 'x01', from: null, date: '2026-10-28T10:00:00Z', steps })

  it('write, затем edit и ещё edit без коммита между ними: у каждой правки свой дифф', async () => {
    const { records } = await recordChain(
      [
        one([
          { id: 'w', write: 'app/route.ts', content: 'a\nb\nc\n' },
          { id: 'e1', edit: 'app/route.ts', find: 'b', replace: 'B' },
          { id: 'e2', edit: 'app/route.ts', find: 'c\n', replace: 'c\nd\n' },
          { id: 'w2', write: 'app/route.ts', content: 'a\nB' },
        ]),
      ],
      { workdir: fresh() },
    )
    expect(sessionProblems(records)).toEqual([])
    const find = makeFind(records)
    expect(find('x01', 'e1', 'file').diff.slice(-5)).toEqual(['@@ -1,3 +1,3 @@', ' a', '-b', '+B', ' c'])
    const e2 = find('x01', 'e2', 'file').diff
    expect(e2).toContain('+d')
    expect(e2).not.toContain('-b')
    expect(e2).not.toContain('+B')
    expect(find('x01', 'w2', 'file')).toMatchObject({ before: 'a\nB\nc\nd\n', after: 'a\nB' })
  })

  it('edit: find не найден или найден дважды — ошибка', async () => {
    const steps = (find: string) => [one([{ id: 'w', write: 'a.txt', content: 'x\nx\nz\n' }, { id: 'e', edit: 'a.txt', find, replace: 'y' }])]
    await expect(recordChain(steps('нет такого'), { workdir: fresh() })).rejects.toThrow(/не найден/)
    await expect(recordChain(steps('x'), { workdir: fresh() })).rejects.toThrow(/несколько раз/)
  })

  it('ошибка шага после запуска сервера: сервер всё равно остановлен', async () => {
    const steps = [
      { id: 'dev', run: `node -e ${sh("require('http').createServer(()=>{}).listen(3000,()=>console.log('Ready'))")}`, until: 'Ready' },
      { id: 'e', edit: 'нет.txt', find: 'x', replace: 'y' },
    ]
    await expect(recordChain([one(steps)], { workdir: fresh() })).rejects.toThrow(/Сессия «x01», шаг «e»: файла «нет.txt» нет/)
    expect(await portFree()).toBe(true)
  })

  it('путь за пределами проекта — ошибка', async () => {
    await expect(recordChain([one([{ id: 'w', write: '../out.txt', content: 'x' }])], { workdir: fresh() })).rejects.toThrow(/вне проекта/)
  })
})

describe('recordChain: файлы после команд', () => {
  const one = (steps: object[]) => ({ id: 'x01', from: null, date: '2026-10-28T10:00:00Z', steps })
  // репозиторий с закоммитенными a.txt и c.txt
  const repo = [
    { id: 'init', run: 'git init -q -b main' },
    { id: 'a', write: 'a.txt', content: 'один\n' },
    { id: 'c', write: 'c.txt', content: 'три\n' },
    { id: 'c1', commit: 'два файла' },
  ]
  // запись сессии из repo и шагов steps: сами записи и поиск события в них
  const play = async (steps: object[]) => {
    const { records } = await recordChain([one([...repo, ...steps])], { workdir: fresh() })
    return { records, find: makeFind(records) }
  }

  it('run: файлы, которые команда создала, изменила и удалила', async () => {
    const { records, find } = await play([
      { id: 'go', run: 'echo x > a.txt && touch b.txt && rm c.txt' },
      { id: 'quiet', run: 'echo привет' },
      { id: 'same', run: 'echo x > a.txt' },
    ])
    expect(find('x01', 'go', 'run').files).toEqual([
      { path: 'a.txt', blob: gitBlobHash('x\n') },
      { path: 'b.txt', blob: gitBlobHash('') },
      { path: 'c.txt', blob: null },
    ])
    // команда без изменений и команда, записавшая то же самое, — без поля
    expect(find('x01', 'quiet', 'run')).not.toHaveProperty('files')
    expect(find('x01', 'same', 'run')).not.toHaveProperty('files')
    expect(sessionProblems(records)).toEqual([])
  })

  it('до git init поля files нет, после — есть; пути по алфавиту, вложенные папки и неотслеживаемые файлы учтены', async () => {
    const { records } = await recordChain(
      [
        one([
          { id: 'pre', run: 'echo до > pre.txt' },
          { id: 'init', run: 'git init -q -b main' },
          { id: 'make', run: 'mkdir -p dir/sub && echo z > z.txt && echo y > dir/sub/y.txt && echo a > dir/a.txt' },
          { id: 'del', run: 'rm -r dir' },
        ]),
      ],
      { workdir: fresh() },
    )
    const find = makeFind(records)
    expect(find('x01', 'pre', 'run')).not.toHaveProperty('files')
    expect(find('x01', 'init', 'run')).not.toHaveProperty('files')
    expect(find('x01', 'make', 'run').files).toEqual([
      { path: 'dir/a.txt', blob: gitBlobHash('a\n') },
      { path: 'dir/sub/y.txt', blob: gitBlobHash('y\n') },
      { path: 'z.txt', blob: gitBlobHash('z\n') },
    ])
    expect(find('x01', 'del', 'run').files).toEqual([
      { path: 'dir/a.txt', blob: null },
      { path: 'dir/sub/y.txt', blob: null },
    ])
  })

  it('игнорируемые файлы (.gitignore) в files не попадают', async () => {
    const { find } = await play([
      { id: 'ign', write: '.gitignore', content: 'out/\n' },
      { id: 'go', run: 'mkdir out && echo x > out/f.txt && echo y > g.txt' },
    ])
    expect(find('x01', 'go', 'run').files).toEqual([{ path: 'g.txt', blob: gitBlobHash('y\n') }])
  })

  it('команда с ошибкой и долгая команда с until тоже дают files', async () => {
    const { find } = await play([
      { id: 'bad', run: 'echo y > g.txt; exit 3' },
      { id: 'dev', run: `echo z > made.txt && node -e ${sh(SERVER)}`, until: 'Ready' },
    ])
    expect(find('x01', 'bad', 'run')).toMatchObject({ code: 3, files: [{ path: 'g.txt', blob: gitBlobHash('y\n') }] })
    expect(find('x01', 'dev', 'run')).toMatchObject({ code: null, files: [{ path: 'made.txt', blob: gitBlobHash('z\n') }] })
  })

  it('edit после команды, изменившей файл: дифф от нового содержимого, сверка чистая', async () => {
    const { records } = await recordChain(
      [
        one([
          { id: 'init', run: 'git init -q -b main' },
          { id: 'w', write: 'a.txt', content: 'a\n' },
          { id: 'c1', commit: 'a' },
          { id: 'go', run: 'printf "b\\n" > a.txt' },
          { id: 'e', edit: 'a.txt', find: 'b', replace: 'c' },
        ]),
      ],
      { workdir: fresh() },
    )
    const e = makeFind(records)('x01', 'e', 'file')
    expect(e).toMatchObject({ before: 'b\n', after: 'c\n' })
    expect(e.diff.slice(-3)).toEqual(['@@ -1 +1 @@', '-b', '+c'])
    expect(sessionProblems(records)).toEqual([])
  })
})

describe('recordChain: ошибки цепочки', () => {
  const session = (id: string, from: string | null, steps: object[] = []) => ({ id, from, date: '2026-10-28T10:00:00Z', steps })

  it('from не совпадает с предыдущей сессией', async () => {
    await expect(recordChain([session('s01', null), session('s03', 's02')], { workdir: fresh() })).rejects.toThrow(/«s03».*«s02»/)
    await expect(recordChain([session('s01', 's00')], { workdir: fresh() })).rejects.toThrow(/«s01»/)
  })

  it('повтор id шага и непонятный шаг', async () => {
    await expect(recordChain([session('s01', null, [{ id: 'a', run: 'true' }, { id: 'a', run: 'true' }])], { workdir: fresh() })).rejects.toThrow(/повторяется шаг «a»/)
    await expect(recordChain([session('s01', null, [{ id: 'a' }])], { workdir: fresh() })).rejects.toThrow(/нужен ровно один из/)
  })

  it('until: процесс закончился, не дождавшись строки', async () => {
    await expect(recordChain([session('s01', null, [{ id: 'dev', run: 'echo привет', until: 'Ready' }])], { workdir: fresh() })).rejects.toThrow(/до строки «Ready»/)
  })

  it('browser без работающего шага с until — ошибка', async () => {
    await expect(recordChain([session('s01', null, [{ id: 'b', browser: { url: '/' } }])], { workdir: fresh() })).rejects.toThrow(/until/)
  })

  it('browser.fill: null и другие не-объекты — понятная ошибка проверки шага', async () => {
    for (const fill of [null, 'Вес', ['Вес']]) {
      const steps = [{ id: 'b', browser: { url: '/', fill } }]
      await expect(recordChain([session('s01', null, steps)], { workdir: fresh() })).rejects.toThrow(/Сессия «s01», шаг «b»: browser\.fill — объект/)
    }
  })

  it('дата сессии без часового пояса — ошибка', async () => {
    const bad = { ...session('s01', null), date: '2026-10-28T10:00:00' }
    await expect(recordChain([bad], { workdir: fresh() })).rejects.toThrow(/часов/)
  })

  it('workdir не пустой — ошибка', async () => {
    const dir = fresh()
    await recordChain([session('s01', null)], { workdir: dir })
    await expect(recordChain([session('s01', null)], { workdir: dir })).rejects.toThrow(/не пуста/)
  })
})

// Учебная цепочка g01 → g02 → g03 без npm: в g01 проект с .env.local (игнорируется git) и папками, которых в состоянии быть не должно.
// Команды g02 и g03 не печатают ничего, что зависит от этих папок, поэтому запись с середины даёт те же события, что и вся цепочка.
const g01 = () => ({
  id: 'g01',
  from: null,
  date: '2026-10-28T10:00:00Z',
  steps: [
    { id: 'init', run: 'git init -q -b main' },
    { id: 'ign', write: '.gitignore', content: '.env.local\nnode_modules/\n.next/\ntest-results/\nplaywright-report/\n' },
    { id: 'one', write: 'a.txt', content: 'один\n' },
    { id: 'env', run: 'echo KEY=demo-not-real > .env.local' },
    {
      id: 'junk',
      run: 'mkdir -p node_modules/pkg .next test-results playwright-report && echo x > node_modules/pkg/index.js && echo y > .next/cache && echo z > test-results/r.txt && echo w > playwright-report/index.html',
    },
    { id: 'c1', commit: 'один' },
  ],
})
const g02 = () => ({
  id: 'g02',
  from: 'g01',
  date: '2026-10-28T11:00:00Z',
  steps: [
    { id: 'look', run: 'cat .env.local && git status --short && git log --oneline' },
    { id: 'two', write: 'b.txt', content: 'два\n' },
    { id: 'c2', commit: 'два' },
  ],
})
const g03 = () => ({
  id: 'g03',
  from: 'g02',
  date: '2026-10-28T12:00:00Z',
  steps: [
    { id: 'ask', agent: { prompt: 'Замени «один» на «ноль»', reply: 'Заменил.' }, steps: [{ id: 'fix', edit: 'a.txt', find: 'один', replace: 'ноль' }] },
    { id: 'c3', commit: 'ноль' },
    { id: 'log', run: 'git log --format="%h %s %ad" --date=iso' },
  ],
})
const chain3 = () => [g01(), g02(), g03()]

// Состояния сессий в папке dir: <id>.tar.gz
const saveTo = (dir: string, saved: string[] = []) => ({
  save: async (id: string, project: string) => {
    saved.push(id)
    await packState(join(dir, `${id}.tar.gz`), project)
  },
})
// Имена в архиве без начального «./»
const listArchive = (archive: string) =>
  execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((name) => name.replace(/^\.\//, ''))
// Хеши коммитов проекта, развёрнутого из архива
const logOf = (archive: string) => {
  const dir = fresh()
  execFileSync('tar', ['-xzf', archive, '-C', dir])
  return execFileSync('git', ['log', '--format=%H %s'], { cwd: dir, encoding: 'utf8' })
}

describe('recordChain: состояние сессии и запись с середины', () => {
  it('состояние: без node_modules и .next, с .git и .env.local', async () => {
    const states = fresh()
    const saved: string[] = []
    await recordChain([g01()], { workdir: fresh(), state: saveTo(states, saved) })
    expect(saved).toEqual(['g01'])
    const names = listArchive(join(states, 'g01.tar.gz'))
    expect(names).toEqual(expect.arrayContaining(['.git/HEAD', '.env.local', '.gitignore', 'a.txt']))
    // ни самих папок, ни их содержимого
    expect(names.filter((name) => /^(node_modules|\.next|test-results|playwright-report)(\/|$)/.test(name))).toEqual([])
  })

  it('состояние сохраняется после каждой сессии цепочки, по порядку', async () => {
    const states = fresh()
    const saved: string[] = []
    await recordChain(chain3(), { workdir: fresh(), state: saveTo(states, saved) })
    expect(saved).toEqual(['g01', 'g02', 'g03'])
    expect(readdirSync(states).sort()).toEqual(['g01.tar.gz', 'g02.tar.gz', 'g03.tar.gz'])
  })

  it('запись с середины: g02 и g03 от состояния g01 — те же записи и хеши коммитов, что у всей цепочки', async () => {
    const full = fresh()
    const whole = await recordChain(chain3(), { workdir: fresh(), state: saveTo(full) })
    expect(sessionProblems(whole.records)).toEqual([])

    const part = fresh()
    const saved: string[] = []
    const loaded: string[] = []
    const rest = await recordChain(chain3(), {
      workdir: fresh(),
      state: {
        ...saveTo(part, saved),
        restore: {
          id: 'g01',
          load: async (project: string) => {
            loaded.push(project)
            await unpackState(join(full, 'g01.tar.gz'), project)
          },
        },
      },
    })
    expect(loaded).toEqual([rest.project])
    expect(rest.records.map((r) => r.id)).toEqual(['g02', 'g03'])
    expect(rest.records).toEqual(whole.records.slice(1))
    expect(rest.records.flatMap(hashes)).toEqual(whole.records.slice(1).flatMap(hashes))
    expect(rest.records.flatMap(hashes)).toHaveLength(2)
    // команды видят восстановленный проект: секрет из .env.local и история git
    const look = rest.records[0].events[0]
    expect(look).toMatchObject({ kind: 'run', code: 0 })
    expect(look.kind === 'run' ? look.out : []).toEqual(['KEY=demo-not-real', expect.stringMatching(/^[0-9a-f]{7} один$/)])
    // сохранены состояния только проигранных сессий, и они такие же, как у всей цепочки
    expect(saved).toEqual(['g02', 'g03'])
    expect(readdirSync(part).sort()).toEqual(['g02.tar.gz', 'g03.tar.gz'])
    for (const id of ['g02', 'g03']) expect(logOf(join(part, `${id}.tar.gz`))).toBe(logOf(join(full, `${id}.tar.gz`)))
  })

  it('restore: сессии нет в цепочке или она последняя — понятная ошибка до запуска команд', async () => {
    const load = async () => {
      throw new Error('состояние не должно разворачиваться')
    }
    const ids = (id: string) => ({ workdir: fresh(), state: { save: async () => {}, restore: { id, load } } })
    await expect(recordChain(chain3(), ids('g09'))).rejects.toThrow(/Нет сессии «g09» в цепочке: g01, g02, g03/)
    await expect(recordChain(chain3(), ids('g03'))).rejects.toThrow(/После сессии «g03» записывать нечего/)
  })

  describe('npm ci при восстановлении', () => {
    // «npm» из PATH — заглушка: пишет в журнал аргументы и папку, а NPM_FAIL=1 заставляет её упасть
    let bin = ''
    let log = ''
    const saved = { PATH: process.env.PATH, NPM_LOG: process.env.NPM_LOG, NPM_FAIL: process.env.NPM_FAIL }
    beforeAll(() => {
      bin = fresh()
      log = join(fresh(), 'npm.log')
      writeFileSync(join(bin, 'npm'), '#!/bin/sh\nprintf "%s | %s\\n" "$*" "$(pwd)" >> "$NPM_LOG"\nif [ "$NPM_FAIL" = 1 ]; then echo "ERR! не вышло"; exit 1; fi\n')
      chmodSync(join(bin, 'npm'), 0o755)
      Object.assign(process.env, { PATH: `${bin}:${process.env.PATH}`, NPM_LOG: log })
    })
    afterAll(() => {
      for (const [name, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[name]
        else process.env[name] = value
      }
    })

    const start = (lock: boolean) => ({
      id: 'n01',
      from: null,
      date: '2026-10-28T10:00:00Z',
      steps: [{ id: 'init', run: 'git init -q -b main' }, ...(lock ? [{ id: 'lock', write: 'package-lock.json', content: '{}\n' }] : []), { id: 'a', write: 'a.txt', content: 'один\n' }, { id: 'c1', commit: 'один' }],
    })
    const next = () => ({ id: 'n02', from: 'n01', date: '2026-10-28T11:00:00Z', steps: [{ id: 'look', run: 'git log --oneline' }] })
    // состояние n01 и запись n02 от него
    const resume = async (lock: boolean) => {
      const states = fresh()
      await recordChain([start(lock), next()], { workdir: fresh(), state: saveTo(states) })
      writeFileSync(log, '')
      const load = (project: string) => unpackState(join(states, 'n01.tar.gz'), project)
      return recordChain([start(lock), next()], { workdir: fresh(), state: { save: async () => {}, restore: { id: 'n01', load } } })
    }

    it('есть package-lock.json — перед цепочкой выполняется npm ci --prefer-offline --no-audit --no-fund в папке проекта; в запись он не попадает', async () => {
      const { records, project } = await resume(true)
      expect(readFileSync(log, 'utf8')).toBe(`ci --prefer-offline --no-audit --no-fund | ${project}\n`)
      expect(records.map((r) => r.events.map((e) => e.id))).toEqual([['look']])
    })

    it('нет package-lock.json — npm не запускается', async () => {
      await resume(false)
      expect(readFileSync(log, 'utf8')).toBe('')
    })

    it('npm ci упал — ошибка с выводом, команды цепочки не выполняются', async () => {
      process.env.NPM_FAIL = '1'
      try {
        await expect(resume(true)).rejects.toThrow(/npm ci не удался \(код 1\)[\s\S]*ERR! не вышло/)
      } finally {
        delete process.env.NPM_FAIL
      }
    })
  })
})

describe('record-session.mjs: запись с середины цепочки', () => {
  const cli = fileURLToPath(new URL('../record-session.mjs', import.meta.url))
  // Свои папки сессий, записей, приложения и состояний: настоящие demo-app и course/video не трогаются
  const setup = (defs = chain3()) => {
    const dirs = { sessions: fresh(), out: fresh(), app: fresh(), state: fresh() }
    for (const def of defs) writeFileSync(join(dirs.sessions, `${def.id}.mjs`), `export default ${JSON.stringify(def)}\n`)
    const env = { RECORD_SESSIONS_DIR: dirs.sessions, RECORD_OUT_DIR: dirs.out, RECORD_APP_DIR: dirs.app, RECORD_STATE_DIR: dirs.state }
    const run = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, ...env }, timeout: LONG })
    return { dirs, run }
  }
  const read = (dir: string, name: string) => readFileSync(join(dir, name), 'utf8')

  it('без аргументов: вся цепочка, записи и состояния всех сессий, приложение из последнего коммита', () => {
    const { dirs, run } = setup()
    const done = run()
    expect(done.stderr).toBe('')
    expect(done.status).toBe(0)
    expect(readdirSync(dirs.out).sort()).toEqual(['g01.json', 'g02.json', 'g03.json'])
    expect(readdirSync(dirs.state).sort()).toEqual(['g01.tar.gz', 'g02.tar.gz', 'g03.tar.gz'])
    expect(readFileSync(join(dirs.app, 'a.txt'), 'utf8')).toBe('ноль\n')
    expect(readdirSync(dirs.app).sort()).toEqual(['.gitignore', 'a.txt', 'b.txt'])
  })

  it('--from g03: пишет только g03 и её состояние, всё раньше не трогает; запись та же, что у всей цепочки', () => {
    const { dirs, run } = setup()
    expect(run().status).toBe(0)
    const whole = { g03: read(dirs.out, 'g03.json'), a: read(dirs.app, 'a.txt'), states: logOf(join(dirs.state, 'g03.tar.gz')) }
    // всё раньше g03 заменено пометками: если рекордер тронет файл, пометка пропадёт (для --from g03 нужно только состояние g02)
    for (const name of ['g01.json', 'g02.json']) writeFileSync(join(dirs.out, name), 'не трогать\n')
    writeFileSync(join(dirs.state, 'g01.tar.gz'), 'не трогать\n')
    const g02State = readFileSync(join(dirs.state, 'g02.tar.gz'))
    rmSync(join(dirs.out, 'g03.json'))
    rmSync(join(dirs.state, 'g03.tar.gz'))
    rmSync(join(dirs.app, 'a.txt'))

    const part = run('--from', 'g03')
    expect(part.stderr).toBe('')
    expect(part.status).toBe(0)
    expect(readdirSync(dirs.out).sort()).toEqual(['g01.json', 'g02.json', 'g03.json'])
    expect(read(dirs.out, 'g01.json')).toBe('не трогать\n')
    expect(read(dirs.out, 'g02.json')).toBe('не трогать\n')
    expect(read(dirs.state, 'g01.tar.gz')).toBe('не трогать\n')
    expect(readFileSync(join(dirs.state, 'g02.tar.gz')).equals(g02State)).toBe(true)
    expect(read(dirs.out, 'g03.json')).toBe(whole.g03)
    expect(logOf(join(dirs.state, 'g03.tar.gz'))).toBe(whole.states)
    expect(read(dirs.app, 'a.txt')).toBe(whole.a)
  })

  it('--from g02: g02 и g03 от состояния g01 — те же записи, что у всей цепочки', () => {
    const { dirs, run } = setup()
    expect(run().status).toBe(0)
    const before = ['g02.json', 'g03.json'].map((name) => read(dirs.out, name))
    writeFileSync(join(dirs.out, 'g01.json'), 'не трогать\n')
    expect(run('--from=g02').status).toBe(0)
    expect(['g02.json', 'g03.json'].map((name) => read(dirs.out, name))).toEqual(before)
    expect(read(dirs.out, 'g01.json')).toBe('не трогать\n')
  })

  it('--from первой сессии записывает всю цепочку: состояния до неё нет и не нужно', () => {
    const { dirs, run } = setup()
    expect(run('--from', 'g01').status).toBe(0)
    expect(readdirSync(dirs.out).sort()).toEqual(['g01.json', 'g02.json', 'g03.json'])
    expect(readdirSync(dirs.state)).toHaveLength(3)
  })

  it('--from: нет состояния предыдущей сессии — понятная ошибка, ничего не записано', () => {
    const { dirs, run } = setup()
    const failed = run('--from', 'g02')
    expect(failed.status).toBe(1)
    expect(failed.stderr).toMatch(/^Нет состояния сессии «g01» \(.*g01\.tar\.gz\): запишите цепочку целиком$/m)
    expect([dirs.out, dirs.state, dirs.app].map((dir) => readdirSync(dir))).toEqual([[], [], []])
  })

  it('--from: неизвестный id — ошибка со списком сессий', () => {
    const { dirs, run } = setup()
    const failed = run('--from', 'g09')
    expect(failed.status).toBe(1)
    expect(failed.stderr).toMatch(/^Нет сессии «g09»\. Сессии цепочки: g01, g02, g03$/m)
    expect([dirs.out, dirs.state, dirs.app].map((dir) => readdirSync(dir))).toEqual([[], [], []])
  })

  it('непонятные аргументы — подсказка по использованию', () => {
    const { run } = setup()
    for (const args of [['--from'], ['--from', '--x'], ['g02'], ['--bogus'], ['--from', 'g02', 'g03']]) {
      const failed = run(...args)
      expect(failed.status, args.join(' ')).toBe(1)
      expect(failed.stderr).toContain('Использование:')
    }
  })
})
