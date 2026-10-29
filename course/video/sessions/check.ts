import { gitBlobHash } from './blob'
import { applyPatch } from './patch'
import type { CommitEvent, SessionRecord } from './types'

// Сверка записей сессий: пустой массив — всё сходится; каждая поломка — одна понятная строка.
// app — путь → blob файлов demo-app/app; если он передан, сверяется с файлами последнего коммита последней сессии.
// Записи считаются эталоном, поэтому «нет файла» и «лишний файл» — про demo-app/app: чего в нём не хватает и что в нём сверх записи.
export function sessionProblems(records: SessionRecord[], app?: Map<string, string>): string[] {
  const problems: string[] = []
  const byId = new Map<string, SessionRecord>()
  for (const r of records) {
    if (byId.has(r.id)) problems.push(`Повторяется запись сессии «${r.id}»`)
    byId.set(r.id, r)
  }
  // known — содержимое файлов, известное из событий file и read; changed — файлы, которые после этого изменила команда (run.files):
  // содержимое неизвестно, но известен хеш (null — файл удалён). Путь живёт в одном из двух списков.
  type FileState = { known: Map<string, string>; changed: Map<string, string | null> }
  const ends = new Map<SessionRecord, FileState>()
  const busy = new Set<SessionRecord>()

  // Проверяет события сессии и возвращает известное содержимое файлов на её конец (вместе с предками по from).
  function visit(rec: SessionRecord): FileState {
    const done = ends.get(rec)
    if (done) return done
    busy.add(rec)
    let known = new Map<string, string>()
    let changed = new Map<string, string | null>()
    if (rec.from !== null) {
      const parent = byId.get(rec.from)
      if (!parent) problems.push(`Сессия «${rec.id}»: нет записи сессии «${rec.from}»`)
      else if (busy.has(parent)) problems.push(`Сессия «${rec.id}»: цепочка сессий зациклена на «${parent.id}»`)
      else {
        const prev = visit(parent)
        known = new Map(prev.known)
        changed = new Map(prev.changed)
      }
    }

    const ids = new Set(rec.events.map((e) => e.id))
    const seen = new Set<string>()
    for (const e of rec.events) {
      const at = `Сессия «${rec.id}», событие «${e.id}»`
      if (seen.has(e.id)) problems.push(`Сессия «${rec.id}»: повторяется событие «${e.id}»`)
      seen.add(e.id)

      if (e.kind === 'file') {
        if (gitBlobHash(e.after) !== e.blob) problems.push(`${at}: хеш не совпадает (файл «${e.path}»)`)
        try {
          if (applyPatch(e.before, e.diff) !== e.after) problems.push(`${at}: дифф не даёт файл «${e.path}»`)
        } catch (err) {
          problems.push(`${at}: дифф не даёт файл «${e.path}» (${err instanceof Error ? err.message : String(err)})`)
        }
        if (changed.has(e.path)) {
          // файл менялся командой: до правки он такой, как записано её хешем (файла нет — before: null)
          const blob = changed.get(e.path)
          if (blob === null ? e.before !== null : gitBlobHash(e.before ?? '') !== blob) problems.push(`${at}: содержимое до правки другое (файл «${e.path}»)`)
          changed.delete(e.path)
        } else {
          const was = known.get(e.path)
          if (was !== undefined && was !== e.before) problems.push(`${at}: содержимое до правки другое (файл «${e.path}»)`)
        }
        known.set(e.path, e.after)
      } else if (e.kind === 'read') {
        if (gitBlobHash(e.text) !== e.blob) problems.push(`${at}: хеш не совпадает (файл «${e.path}»)`)
        if (changed.has(e.path)) {
          if (gitBlobHash(e.text) !== changed.get(e.path)) problems.push(`${at}: прочитанное содержимое другое (файл «${e.path}»)`)
          changed.delete(e.path)
        }
        known.set(e.path, e.text)
      } else if (e.kind === 'run') {
        for (const f of e.files ?? []) {
          known.delete(f.path)
          changed.set(f.path, f.blob)
        }
      } else if (e.kind === 'agent') {
        for (const step of e.steps) if (!ids.has(step)) problems.push(`${at}: шаг агента «${step}» не найден`)
      }
    }

    busy.delete(rec)
    const end = { known, changed }
    ends.set(rec, end)
    return end
  }
  for (const rec of records) visit(rec)

  if (app) {
    const last = records.at(-1)
    const commit = last?.events.findLast((e): e is CommitEvent => e.kind === 'commit')
    if (!last) problems.push('demo-app/app: нет записей сессий')
    else if (!commit) problems.push('demo-app/app: в последней сессии нет коммита')
    else {
      const committed = new Map(commit.files.map((f) => [f.path, f.blob]))
      for (const [path, blob] of committed) {
        const mine = app.get(path)
        if (mine === undefined) problems.push(`demo-app/app: нет файла «${path}»`)
        else if (mine !== blob) problems.push(`demo-app/app: другой файл «${path}»`)
      }
      for (const path of app.keys()) if (!committed.has(path)) problems.push(`demo-app/app: лишний файл «${path}»`)
    }
  }
  return problems
}
