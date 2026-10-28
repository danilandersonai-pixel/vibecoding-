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

test('git: слияние, выдуманная команда, ключ вне коммитов', () => {
  expect(find('s02-sets', 'merge', 'run').out.join('\n')).toContain('Fast-forward')
  expect(find('s02-sets', 'start-dev', 'run').code).not.toBe(0)
  expect(find('s02-sets', 'start-dev', 'run').out.join('\n')).toContain('Missing script')
  expect(find('s02-sets', 'ignored', 'run').out[0]).toMatch(/^\.gitignore:\d+:/)
  expect(find('s02-sets', 'status-env', 'run').out).toEqual([])
  expect(find('s01-start', 'claude-file', 'file').after).toMatch(/Next\.js 16[\s\S]*Нельзя/)
})
