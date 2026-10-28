import { makeFind } from '../../sessions/types'
import type { SessionEvent, SessionRecord } from '../../sessions/types'
import type { Clock, FrameCtx } from '../frame'

// Фикстура тестов кадров: маленькая своя запись сессии (не настоящая) и всё, что кадру нужно из урока.
// Задача 6 дописала агента (ag), коммиты в двух ветках (c2–c4) и страницы браузера (form, form-long); Задача 7 допишет своё.

const CWD = '~/trainer-app'

const PAGE_BEFORE = [
  "import { useState } from 'react'",
  '',
  'export default function Page() {',
  "  const [weight, setWeight] = useState('')",
  '  return null',
  '}',
]
const PAGE_AFTER = [
  "import { useState } from 'react'",
  '',
  'export default function Page() {',
  '  // вес в килограммах',
  "  const [weight, setWeight] = useState('')",
  "  const [error, setError] = useState('')",
  '  return <p>{weight}</p>',
  '}',
]
// Новые строки файла после правки: 4, 6, 7; убрана одна («return null»).
const PAGE_DIFF = [
  'diff --git a/app/page.tsx b/app/page.tsx',
  'index 1111111..2222222 100644',
  '--- a/app/page.tsx',
  '+++ b/app/page.tsx',
  '@@ -1,6 +1,8 @@',
  " import { useState } from 'react'",
  ' ',
  ' export default function Page() {',
  '+  // вес в килограммах',
  "   const [weight, setWeight] = useState('')",
  '-  return null',
  "+  const [error, setError] = useState('')",
  '+  return <p>{weight}</p>',
  ' }',
]

const ROUTE_AFTER = ['export async function GET() {', '  return Response.json({ sets: [] })', '}', '// POST пока не готов']
const ROUTE_DIFF = [
  'diff --git a/app/api/sets/route.ts b/app/api/sets/route.ts',
  'new file mode 100644',
  'index 0000000..3333333',
  '--- /dev/null',
  '+++ b/app/api/sets/route.ts',
  '@@ -0,0 +1,4 @@',
  ...ROUTE_AFTER.map((l) => '+' + l),
]

const WIDE = Array.from({ length: 25 }, (_, i) => `строка ${i + 1}`)
const WIDE_DIFF = [
  'diff --git a/docs/wide.md b/docs/wide.md',
  'new file mode 100644',
  'index 0000000..4444444',
  '--- /dev/null',
  '+++ b/docs/wide.md',
  '@@ -0,0 +1,25 @@',
  ...WIDE.map((l) => '+' + l),
]

const PACKAGE = ['{', '  "name": "trainer-app",', '  "version": "0.1.0",', '  "private": true', '}']
const BIG = Array.from({ length: 30 }, (_, i) => `// строка ${i + 1}`)

// Короткая запись коммита для тестов графа: файлов нет, вывод — одна строка.
function commit(id: string, hash: string, message: string, branch: string, parents: string[]): SessionEvent {
  return { id, kind: 'commit', cmd: `git commit -m "${message}"`, hash, message, branch, parents, out: [`[${branch} ${hash}] ${message}`], files: [] }
}

const events: SessionEvent[] = [
  { id: 'ls', kind: 'run', cwd: CWD, cmd: 'ls', out: ['app', 'package.json', 'README.md'], code: 0 },
  { id: 'fail', kind: 'run', cwd: CWD, cmd: 'npm test', out: ['> trainer-app@0.1.0 test', '✗ 1 тест не прошёл', 'Ошибка: вес должен быть числом'], code: 1 },
  { id: 'long', kind: 'run', cwd: CWD, cmd: 'cat log.txt', out: ['abcdefghij'.repeat(30)], code: 0 },
  { id: 'huge', kind: 'run', cwd: CWD, cmd: 'cat dump.txt', out: ['x'.repeat(2000)], code: 0 },
  { id: 'many', kind: 'run', cwd: CWD, cmd: 'seq 1 40', out: Array.from({ length: 40 }, (_, i) => `строка ${i + 1}`), code: 0 },
  { id: 'dev', kind: 'run', cwd: CWD, cmd: 'npm run dev', out: ['', '> next dev', '✓ Ready in 493ms'], code: null },
  {
    id: 'c1',
    kind: 'commit',
    cmd: 'git commit -m "Первое сохранение"',
    hash: 'abc1234',
    message: 'Первое сохранение',
    branch: 'main',
    parents: [],
    out: ['[main abc1234] Первое сохранение', ' 2 files changed, 12 insertions(+)'],
    files: ['README.md', 'app/api/sets/route.ts', 'app/page.tsx', 'package.json', 'public/a.svg', 'public/b.svg'].map((path, i) => ({ path, blob: `b${i}` })),
  },
  { id: 'page', kind: 'file', path: 'app/page.tsx', before: PAGE_BEFORE.join('\n') + '\n', after: PAGE_AFTER.join('\n') + '\n', diff: PAGE_DIFF, blob: 'p1' },
  { id: 'route', kind: 'file', path: 'app/api/sets/route.ts', before: null, after: ROUTE_AFTER.join('\n') + '\n', diff: ROUTE_DIFF, blob: 'r1' },
  { id: 'wide', kind: 'file', path: 'docs/wide.md', before: null, after: WIDE.join('\n') + '\n', diff: WIDE_DIFF, blob: 'w1' },
  { id: 'pkg', kind: 'read', path: 'package.json', text: PACKAGE.join('\n') + '\n', blob: 'k1' },
  { id: 'big', kind: 'read', path: 'docs/big.md', text: BIG.join('\n') + '\n', blob: 'k2' },
  {
    id: 'save',
    kind: 'browser',
    url: 'http://localhost:3000/',
    title: 'Тренер',
    fields: [],
    buttons: [],
    before: [],
    after: [],
    console: [],
    network: [],
    server: ['', ' GET / 200 in 120ms', ' POST /api/sets 400 in 10ms', ' GET /api/sets 200 in 5ms'],
  },
  { id: 'ask', kind: 'agent', prompt: 'Добавь проверку веса', reply: 'Готово', steps: ['page'] },
  { id: 'rd-page', kind: 'read', path: 'app/page.tsx', text: PAGE_BEFORE.join('\n') + '\n', blob: 'k3' },
  // Коммиты в двух ветках: c2 на main, c3 на sets-form, c4 снова на main (после слияния fast-forward родитель — c3).
  commit('c2', 'bcd2345', 'Проверка веса', 'main', ['abc1234']),
  commit('c3', 'cde3456', 'Форма подхода', 'sets-form', ['bcd2345']),
  commit('c4', 'def4567', 'Мини-набор задач', 'main', ['cde3456']),
  commit('c-long', 'efa5678', 'Очень длинное сообщение коммита, которое не помещается рядом с графом и метками веток в одну строку окна', 'main', ['def4567']),
  {
    id: 'ag',
    kind: 'agent',
    prompt: 'Добавь проверку веса в форму подхода',
    reply: 'Готово: вес проверяется, ошибка видна под формой. Один тест не прошёл, я записал это в коммит.',
    steps: ['rd-page', 'route', 'page', 'fail', 'c2'],
  },
  {
    id: 'form',
    kind: 'browser',
    url: 'http://localhost:3000/',
    title: 'Тренировка',
    fields: [
      { label: 'Вес, кг', value: '60 кг' },
      { label: 'Повторы', value: '8' },
    ],
    buttons: ['Сохранить подход'],
    before: ['Тренировка', 'Вес, кг', 'Повторы', 'Сохранить подход', 'Сохранённые подходы', 'Подходов пока нет'],
    after: ['Тренировка', 'Вес, кг', 'Повторы', 'Сохранить подход', 'Вес должен быть числом, например 60', 'Сохранённые подходы', 'Подходов пока нет'],
    console: [
      { type: 'info', text: '%cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold' },
      { type: 'log', text: '[HMR] connected' },
      { type: 'warning', text: 'Slow network is detected.' },
      { type: 'error', text: 'Failed to load resource: the server responded with a status of 400 (Bad Request)' },
    ],
    network: [{ method: 'POST', url: 'http://localhost:3000/api/sets', status: 400 }],
    server: [],
  },
  {
    id: 'form-long',
    kind: 'browser',
    url: 'http://localhost:3000/sets?day=1',
    title: 'Длинная страница',
    fields: [],
    buttons: [],
    before: Array.from({ length: 20 }, (_, i) => `Строка страницы ${i + 1}`),
    after: [],
    console: [],
    network: [],
    server: [],
  },
]

export const FIXTURE: SessionRecord = { id: 'fixture', from: null, recorded: '2026-10-28', events }

export const ctx: FrameCtx = {
  find: makeFind([FIXTURE]),
  lesson: { id: 'fixture', title: 'Фикстура', chapters: ['Что узнаете', 'А', 'Итог'], book: ['sa1'] },
}

/** Часы тестов: реплика i начинается на кадре 30 + i·90, сцена кончается через 30 кадров после последней реплики. */
export function makeClock(lines: number): Clock {
  return { beat: (i) => 30 + i * 90, duration: 30 + lines * 90 + 30, lines }
}

/** Часы сцены из шести реплик. */
export const CLOCK = makeClock(6)
