// Записи сессий: что рекордер сохранил из настоящей работы (команды, файлы, коммиты, агент, браузер).
// Кадры роликов берут отсюда только типы и makeFind; хеши и патчи (node:crypto) — в blob.ts, patch.ts.

type By = { by?: 'agent' }

// files — файлы проекта, которые команда создала, изменила (blob — хеш нового содержимого) или удалила (blob: null), по пути;
// нет поля — команда файлов не трогала или проекта под git ещё не было (до `git init`).
export type RunEvent = { id: string; kind: 'run'; cwd: string; cmd: string; out: string[]; code: number | null; files?: { path: string; blob: string | null }[] } & By
export type FileEvent = { id: string; kind: 'file'; path: string; before: string | null; after: string; diff: string[]; blob: string } & By
export type ReadEvent = { id: string; kind: 'read'; path: string; text: string; blob: string } & By
export type CommitEvent = {
  id: string
  kind: 'commit'
  cmd: string
  hash: string
  message: string
  branch: string
  parents: string[]
  out: string[]
  files: { path: string; blob: string }[]
} & By
export type AgentEvent = { id: string; kind: 'agent'; prompt: string; reply: string; steps: string[] }
// url — адрес, который открыли (страница открылась именно по нему, перенаправление рекордер не принимает); urlAfter — адрес страницы
// в конце шага (после нажатий), если он другой: нажатие привело на другую страницу.
export type BrowserEvent = {
  id: string
  kind: 'browser'
  url: string
  urlAfter?: string
  title: string
  fields: { label: string; value: string }[]
  buttons: string[]
  before: string[]
  after: string[]
  console: { type: string; text: string }[]
  network: { method: string; url: string; status: number }[]
  server: string[]
} & By

export type SessionEvent = RunEvent | FileEvent | ReadEvent | CommitEvent | AgentEvent | BrowserEvent
export type SessionRecord = { id: string; from: string | null; recorded: string; events: SessionEvent[] }

export type Find = <K extends SessionEvent['kind']>(session: string, id: string, kind: K) => Extract<SessionEvent, { kind: K }>

// Поиск события по сессии, id и виду; нет сессии, события или вид другой — ошибка с понятным текстом.
export function makeFind(records: SessionRecord[]): Find {
  const byId = new Map(records.map((r) => [r.id, r]))
  return (session, id, kind) => {
    const record = byId.get(session)
    if (!record) throw new Error(`Нет записи сессии «${session}»`)
    const event = record.events.find((e) => e.id === id)
    if (!event) throw new Error(`В сессии «${session}» нет события «${id}»`)
    if (event.kind !== kind) throw new Error(`Событие «${id}» сессии «${session}» — «${event.kind}», а нужно «${kind}»`)
    return event as Extract<SessionEvent, { kind: typeof kind }>
  }
}
