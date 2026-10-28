import { describe, expect, it } from 'vitest'
import { gitBlobHash } from './blob'
import { sessionProblems } from './check'
import { makeFind } from './types'
import type { AgentEvent, CommitEvent, FileEvent, ReadEvent, RunEvent, SessionRecord } from './types'

// Дифф «файл заменён целиком»: для фикстур хватает, а проверяет его настоящий applyPatch.
function diffOf(path: string, before: string | null, after: string): string[] {
  const lines = (s: string) => (s === '' ? [] : s.replace(/\n$/, '').split('\n'))
  const old = lines(before ?? '')
  const next = lines(after)
  return [
    `diff --git a/${path} b/${path}`,
    ...(before === null ? ['new file mode 100644', '--- /dev/null'] : [`--- a/${path}`]),
    `+++ b/${path}`,
    `@@ -${old.length ? 1 : 0},${old.length} +${next.length ? 1 : 0},${next.length} @@`,
    ...old.map((l) => `-${l}`),
    ...next.map((l) => `+${l}`),
  ]
}

// Строители событий: хеши всегда считает gitBlobHash, руками их не вписываем.
const run = (id: string): RunEvent => ({ id, kind: 'run', cwd: '/work', cmd: 'npm run dev', out: ['ready'], code: 0 })
const edit = (id: string, path: string, before: string | null, after: string): FileEvent => ({
  id,
  kind: 'file',
  path,
  before,
  after,
  diff: diffOf(path, before, after),
  blob: gitBlobHash(after),
})
const read = (id: string, path: string, text: string): ReadEvent => ({ id, kind: 'read', path, text, blob: gitBlobHash(text) })
const agent = (id: string, steps: string[]): AgentEvent => ({ id, kind: 'agent', prompt: 'Сделай страницу', reply: 'Готово', steps })
const commit = (id: string, files: Record<string, string>): CommitEvent => ({
  id,
  kind: 'commit',
  cmd: 'git commit -m "Первый"',
  hash: 'abc1234',
  message: 'Первый',
  branch: 'main',
  parents: [],
  out: ['1 file changed'],
  files: Object.entries(files).map(([path, text]) => ({ path, blob: gitBlobHash(text) })),
})

const V1 = 'one\ntwo\n'
const V2 = 'one\nTWO\n'

// Запись из двух сессий: во второй читают и правят файл, созданный в первой.
const records = (): SessionRecord[] => [
  {
    id: 's01',
    from: null,
    recorded: '2026-10-28',
    events: [run('dev'), agent('ask', ['f1']), edit('f1', 'a.txt', null, V1), commit('c1', { 'a.txt': V1 })],
  },
  {
    id: 's02',
    from: 's01',
    recorded: '2026-10-28',
    events: [read('r1', 'a.txt', V1), edit('f2', 'a.txt', V1, V2), commit('c2', { 'a.txt': V2 })],
  },
]
const appOf = (files: Record<string, string>) => new Map(Object.entries(files).map(([path, text]) => [path, gitBlobHash(text)]))

// Ровно одна поломка — ровно одна строка с нужным фрагментом.
function expectOnly(recs: SessionRecord[], fragment: string, app?: Map<string, string>) {
  const found = sessionProblems(recs, app)
  expect(found).toHaveLength(1)
  expect(found[0]).toContain(fragment)
}

describe('sessionProblems', () => {
  it('верная запись — без замечаний', () => {
    expect(sessionProblems(records())).toEqual([])
    expect(sessionProblems(records(), appOf({ 'a.txt': V2 }))).toEqual([])
  })

  it('повтор id события', () => {
    const r = records()
    r[0].events.push(run('dev'))
    expectOnly(r, 'повторяется событие «dev»')
  })

  it('одинаковые id в разных сессиях — не повтор', () => {
    const r = records()
    r[1].events.push(run('dev'))
    expect(sessionProblems(r)).toEqual([])
  })

  it('from указывает на сессию без записи', () => {
    const r = records()
    r[1].from = 's00-x'
    expectOnly(r, 'нет записи сессии «s00-x»')
  })

  it('повтор записи сессии', () => {
    const r = records()
    r.push({ id: 's02', from: 's01', recorded: '2026-10-28', events: [] })
    expect(sessionProblems(r).join('\n')).toContain('Повторяется запись сессии «s02»')
  })

  it('зацикленная цепочка сессий не вешает проверку', () => {
    const r = records()
    r[0].from = 's02'
    expect(sessionProblems(r).join('\n')).toContain('зациклена')
  })

  it('хеш файла не совпал', () => {
    const r = records()
    makeFind(r)('s02', 'f2', 'file').blob = gitBlobHash('другое\n')
    expectOnly(r, 'хеш не совпадает')
  })

  it('хеш прочитанного не совпал', () => {
    const r = records()
    makeFind(r)('s02', 'r1', 'read').blob = gitBlobHash('другое\n')
    expectOnly(r, 'хеш не совпадает')
  })

  it('дифф не даёт файл', () => {
    const r = records()
    makeFind(r)('s02', 'f2', 'file').diff = diffOf('a.txt', V1, 'one\nTHREE\n')
    expectOnly(r, 'дифф не даёт файл')
  })

  it('дифф не ложится на содержимое до правки', () => {
    const r = records()
    makeFind(r)('s02', 'f2', 'file').diff = diffOf('a.txt', 'чужое\n', V2)
    const found = sessionProblems(r)
    expect(found).toHaveLength(1)
    expect(found[0]).toContain('дифф не даёт файл')
    expect(found[0]).toContain('Дифф не ложится')
  })

  it('содержимое до правки другое', () => {
    const r = records()
    Object.assign(makeFind(r)('s02', 'f2', 'file'), edit('f2', 'a.txt', 'левое\n', V2))
    expectOnly(r, 'содержимое до правки другое')
  })

  it('файл «создан» заново, хотя он уже был в цепочке', () => {
    const r = records()
    Object.assign(makeFind(r)('s02', 'f2', 'file'), edit('f2', 'a.txt', null, V2))
    expectOnly(r, 'содержимое до правки другое')
  })

  it('прочитанный файл тоже считается известным содержимым', () => {
    const r = records()
    r[1].events.splice(2, 0, read('r2', 'z.txt', 'z\n'), edit('f3', 'z.txt', 'z\n', 'Z\n'))
    expect(sessionProblems(r)).toEqual([])
    makeFind(r)('s02', 'f3', 'file').before = 'y\n'
    makeFind(r)('s02', 'f3', 'file').diff = diffOf('z.txt', 'y\n', 'Z\n')
    expectOnly(r, 'содержимое до правки другое')
  })

  it('путь, которого в цепочке не было, правится с любого содержимого', () => {
    const r = records()
    r[1].events.splice(2, 0, edit('f3', 'b.txt', 'было в репозитории\n', 'стало\n'))
    expect(sessionProblems(r)).toEqual([])
  })

  it('шаг агента ссылается на несуществующее событие', () => {
    const r = records()
    makeFind(r)('s01', 'ask', 'agent').steps = ['f1', 'x']
    expectOnly(r, 'шаг агента «x» не найден')
  })

  it('app: в demo-app/app нет файла из последнего коммита', () => {
    expectOnly(records(), 'demo-app/app: нет файла «a.txt»', appOf({}))
  })

  it('app: в demo-app/app лишний файл', () => {
    expectOnly(records(), 'demo-app/app: лишний файл «b.txt»', appOf({ 'a.txt': V2, 'b.txt': 'b\n' }))
  })

  it('app: файл в demo-app/app другой', () => {
    expectOnly(records(), 'demo-app/app: другой файл «a.txt»', appOf({ 'a.txt': V1 }))
  })

  it('app: берётся последний коммит последней сессии', () => {
    const r = records()
    r[1].events.push(commit('c3', { 'a.txt': V1 }))
    expectOnly(r, 'demo-app/app: другой файл «a.txt»', appOf({ 'a.txt': V2 }))
  })

  it('app: в последней сессии нет коммита', () => {
    const r = records()
    r[1].events.pop()
    expectOnly(r, 'demo-app/app: в последней сессии нет коммита', appOf({ 'a.txt': V2 }))
  })
})

describe('makeFind', () => {
  it('находит событие нужного вида', () => {
    const find = makeFind(records())
    expect(find('s02', 'f2', 'file').after).toBe(V2)
    expect(find('s01', 'dev', 'run').cmd).toBe('npm run dev')
  })

  it('нет сессии — ошибка с её id', () => {
    expect(() => makeFind(records())('s09', 'dev', 'run')).toThrow('s09')
  })

  it('нет события — ошибка с id сессии и события', () => {
    const find = makeFind(records())
    expect(() => find('s01', 'nope', 'run')).toThrow('s01')
    expect(() => find('s01', 'nope', 'run')).toThrow('nope')
  })

  it('событие другого вида — ошибка с обоими видами', () => {
    const find = makeFind(records())
    expect(() => find('s01', 'dev', 'file')).toThrow('run')
    expect(() => find('s01', 'dev', 'file')).toThrow('file')
  })
})
