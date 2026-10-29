import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

// Каждый урок подключает только свои записи сессий (README набора, §2 и ловушка 7): общий video/sessions/index.ts тянет в
// сборку все записи, а ленивый кусок урока (Video.tsx) должен нести только те, что урок показывает. Поэтому ни набор,
// ни уроки его не импортируют: запись берётся прямым импортом JSON (…/sessions/<id>.json), типы — из …/sessions/types.
const VIDEO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SESSIONS = join(VIDEO, 'sessions')

/** Файлы .ts и .tsx под папкой, кроме тестов (*.test.ts, *.test.tsx). */
function sources(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
    .map((f) => join(dir, f))
}

/** Откуда файл тянет общий список записей: пути импортов (import/export … from, import('…'), require) и import.meta.glob по записям. */
function sessionsIndexImports(file: string, text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(/(?:\bfrom|\bimport|\brequire)\s*\(?\s*(['"])([^'"]+)\1/g)) {
    const spec = m[2]
    if (!spec.startsWith('.')) continue
    const target = resolve(dirname(file), spec).replace(/\.(?:[cm]?[jt]sx?)$/, '')
    if (target === SESSIONS || target === join(SESSIONS, 'index')) out.push(spec)
  }
  for (const m of text.matchAll(/import\.meta\.glob\s*\(\s*(['"`[])([^)]*)\)/g)) {
    if (/sessions/.test(m[2])) out.push(`import.meta.glob(${m[1]}${m[2]})`)
  }
  return out
}

const files = [...sources(join(VIDEO, 'term')), ...sources(join(VIDEO, 'lessons'))]

test('проверка видит файлы набора и обоих пилотных уроков (не пуста)', () => {
  const rel = files.map((f) => relative(VIDEO, f))
  expect(rel).toContain(join('term', 'build.ts'))
  expect(rel).toContain(join('term', 'LessonVideo.tsx'))
  expect(rel).toContain(join('term', 'frames', 'terminalPlan.ts'))
  expect(rel).toContain(join('lessons', 'ch-abc', 'lesson.ts'))
  expect(rel).toContain(join('lessons', 'ch-01', 'Video.tsx'))
  expect(rel.some((f) => f.endsWith('.test.ts') || f.endsWith('.test.tsx'))).toBe(false)
})

test('код набора и уроков не импортирует общий список записей', () => {
  const bad = files.flatMap((f) => sessionsIndexImports(f, readFileSync(f, 'utf8')).map((spec) => `${relative(VIDEO, f)}: ${spec}`))
  expect(bad, 'урок импортирует свои записи сам (…/sessions/<id>.json), а не video/sessions/index').toEqual([])
})

test('проверка различает: типы и JSON записи — можно, папка записей и её index (в любой записи пути) — нельзя', () => {
  const at = join(VIDEO, 'term', 'x.ts')
  const lesson = join(VIDEO, 'lessons', 'ch-xx', 'lesson.ts')
  expect(sessionsIndexImports(at, "import type { Find } from '../sessions/types'")).toEqual([])
  expect(sessionsIndexImports(lesson, "import s01 from '../../sessions/s01-start.json'")).toEqual([])
  expect(sessionsIndexImports(lesson, "import { makeFind } from '../../sessions/types'")).toEqual([])
  expect(sessionsIndexImports(at, "import { find } from '../sessions'")).toEqual(['../sessions'])
  expect(sessionsIndexImports(at, "import { find } from '../sessions/index'")).toEqual(['../sessions/index'])
  expect(sessionsIndexImports(at, 'import { find } from "../sessions/index.ts"')).toEqual(['../sessions/index.ts'])
  expect(sessionsIndexImports(lesson, "export { sessions } from '../../sessions/'")).toEqual(['../../sessions/'])
  expect(sessionsIndexImports(at, "const m = await import('../sessions')")).toEqual(['../sessions'])
  expect(sessionsIndexImports(at, "const all = import.meta.glob('../sessions/*.json')")).toEqual(["import.meta.glob('../sessions/*.json')"])
  // Чужая папка с таким же именем и пакеты — не общий список записей
  expect(sessionsIndexImports(at, "import { x } from './frames/sessions'")).toEqual([])
  expect(sessionsIndexImports(at, "import { x } from 'sessions'")).toEqual([])
})
