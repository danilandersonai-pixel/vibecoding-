// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { gitBlobHash } from '../../video/sessions/blob'
import { sessionProblems } from '../../video/sessions/check'
import { makeFind } from '../../video/sessions/types'
import type { CommitEvent, SessionRecord } from '../../video/sessions/types'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { limitText, RUN_LIMIT_MS, recordChain } from './record.mjs'

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
