import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import glossary from '../../content/glossary.json'
import { IconBook, IconClose, IconSearch } from '../components/icons'
import { getDays } from '../content/load'
import { courseEntries, termEntries, type CourseEntry, type SearchTarget, type TermEntry } from './courseIndex'
import { goToResult } from './goTo'
import { queryWords } from './normalize'
import { makeSnippet, searchBook, searchCourse, searchTerms, type BookEntry, type Hit, type Mark } from './search'

const EXAMPLES = ['RLS', 'Агент', 'спецификация', 'коммит']
// Сколько результатов группы видно сразу; остальные — по «Показать все N»
const LIMIT = 5

// Записи курса и словаря строятся один раз, при первом поиске: у поиска кэш свёрнутых строк по объекту записи
let local: { course: CourseEntry[]; terms: TermEntry[] } | null = null
function localEntries() {
  local ??= { course: courseEntries(getDays()), terms: termEntries(glossary, getDays()) }
  return local
}

// Индекс книги — отдельный кусок сборки, грузится при первом открытии окна; не загрузился — следующее открытие попробует снова.
// Состояние загрузки живёт вне React (одно на приложение), окно читает его через useSyncExternalStore
type Book = BookEntry[] | 'loading' | 'failed'
let book: Book = 'loading'
let loading = false
const listeners = new Set<() => void>()

function setBook(next: Book) {
  book = next
  for (const l of listeners) l()
}

function loadBook() {
  if (loading || Array.isArray(book)) return
  loading = true
  setBook('loading')
  import('../../content/book-index.json').then(
    (m) => {
      loading = false
      setBook(m.default)
    },
    () => {
      loading = false
      setBook('failed')
    },
  )
}

function subscribeBook(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

const bookSnapshot = () => book

// Текст с метками совпадений. Только текстом через React: в книге бывает код с сырыми «<» и «&»
function Marked({ text, marks }: { text: string; marks: Mark[] }) {
  const parts: ReactNode[] = []
  let at = 0
  marks.forEach(([a, b], i) => {
    if (a > at) parts.push(text.slice(at, a))
    parts.push(<mark key={i}>{text.slice(a, b)}</mark>)
    at = b
  })
  if (at < text.length) parts.push(text.slice(at))
  return parts
}

// Подпись, название и фрагмент результата. Фрагмента нет, если он пустой или повторяет название (запись-заголовок книги)
function HitBody<T>({ label, title, text, hit }: { label: string; title: string; text: string; hit: Hit<T> }) {
  return (
    <>
      <span className="search-label">{label}</span>
      <span className="search-title">
        <Marked text={title} marks={hit.titleMarks} />
      </span>
      {hit.snippet !== '' && text !== title && (
        <span className="search-snippet">
          <Marked text={hit.snippet} marks={hit.snippetMarks} />
        </span>
      )}
    </>
  )
}

// Переход по ссылке «День N» — из скрипта, как у RouteLink; с Ctrl/⌘/Shift — как обычная ссылка
function plainClick(e: MouseEvent): boolean {
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
}

// Группа результатов: заголовок с числом, первые LIMIT и «Показать все N». После раскрытия фокус — на первом новом результате
function Group<T>({ id, title, hits, render }: { id: string; title: string; hits: Hit<T>[]; render: (hit: Hit<T>) => ReactNode }) {
  const [all, setAll] = useState(false)
  const list = useRef<HTMLUListElement>(null)
  const focusNext = useRef(false)
  useEffect(() => {
    if (!all || !focusNext.current) return
    focusNext.current = false
    const li = list.current?.children[LIMIT] as HTMLElement | undefined
    ;(li?.querySelector<HTMLElement>('a, button') ?? li)?.focus()
  }, [all])
  const shown = all ? hits : hits.slice(0, LIMIT)
  return (
    <section className="search-group" aria-labelledby={id}>
      <h2 id={id} className="search-group-title">
        {title} <span className="search-count">{hits.length}</span>
      </h2>
      <ul ref={list} className="search-list">
        {shown.map((hit, i) => (
          <li key={i} tabIndex={-1}>
            {render(hit)}
          </li>
        ))}
      </ul>
      {!all && hits.length > LIMIT && (
        <button
          type="button"
          className="btn search-more"
          onClick={() => {
            focusNext.current = true
            setAll(true)
          }}
        >
          {`Показать все ${hits.length}`}
        </button>
      )}
    </section>
  )
}

// «В книге» пока индекс грузится или если не загрузился
function BookNote({ id, text }: { id: string; text: string }) {
  return (
    <section className="search-group" aria-labelledby={id}>
      <h2 id={id} className="search-group-title">
        В книге
      </h2>
      <p className="search-note">{text}</p>
    </section>
  )
}

// Окно поиска — одно на приложение (в App). Запрос сохраняется между открытиями.
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const uid = useId()
  const [query, setQuery] = useState('')
  const book = useSyncExternalStore(subscribeBook, bookSnapshot)
  const panel = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const body = useRef<HTMLDivElement>(null)
  // Щелчок по затемнению закрывает окно, только если и нажали на затемнении: выделение текста в поле мышью не закроет окно
  const downOnLayer = useRef(false)

  // Открытие: прокрутка страницы заблокирована, фокус в поле, Tab и фокус не уходят из окна.
  // Закрытие и размонтирование: всё обратно, фокус — туда, где был при открытии (кнопка «Поиск» или поле, откуда нажали Ctrl+K)
  useLayoutEffect(() => {
    if (!open) return
    const from = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.documentElement
    const prev = { overflow: root.style.overflow, padding: document.body.style.paddingRight }
    // Полоса прокрутки пропадает — её ширину занимает отступ, и страница под окном не сдвигается вбок.
    // Без раскладки (jsdom) ширины нет вовсе — тогда отступа нет
    const bar = window.innerWidth - root.clientWidth
    root.style.overflow = 'hidden'
    if (root.clientWidth > 0 && bar > 0) document.body.style.paddingRight = `${bar}px`
    input.current?.focus()
    input.current?.select()
    const keep = (e: FocusEvent) => {
      if (panel.current && e.target instanceof Node && !panel.current.contains(e.target)) input.current?.focus()
    }
    document.addEventListener('focusin', keep)
    return () => {
      document.removeEventListener('focusin', keep)
      root.style.overflow = prev.overflow
      document.body.style.paddingRight = prev.padding
      if (from?.isConnected) from.focus({ preventScroll: true })
    }
  }, [open])

  // Книга — при открытии окна (загруженная второй раз не грузится)
  useEffect(() => {
    if (open) loadBook()
  }, [open])

  const words = useMemo(() => queryWords(query), [query])
  const results = useMemo(() => {
    if (!open || words.length === 0) return null
    const { course, terms } = localEntries()
    return {
      terms: searchTerms(query, terms),
      course: searchCourse(query, course),
      book: Array.isArray(book) ? searchBook(query, book) : [],
    }
  }, [open, words, query, book])

  if (!open) return null

  // Окно закрывается сразу (страница разблокирована, фокус вернулся), затем переход и прокрутка к месту
  const go = (target: SearchTarget) => {
    flushSync(onClose)
    goToResult(target)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panel.current) return
    const items = [...panel.current.querySelectorAll<HTMLElement>('input, button:not(:disabled), a[href]')]
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    // по кругу: с последнего — на первый, с первого (или с самой панели) — на последний
    const at = document.activeElement
    if (!at) return
    if (e.shiftKey && (at === first || first.compareDocumentPosition(at) & Node.DOCUMENT_POSITION_PRECEDING)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (at === last || last.compareDocumentPosition(at) & Node.DOCUMENT_POSITION_FOLLOWING)) {
      e.preventDefault()
      first.focus()
    }
  }

  const total = results ? results.terms.length + results.course.length + results.book.length : 0
  const status = !results
    ? ''
    : total > 0
      ? `Найдено: ${total}`
      : book === 'loading'
        ? ''
        : 'Ничего не нашлось. Попробуйте другое слово или часть слова.'

  return (
    <div
      className="search-layer"
      onMouseDown={(e) => {
        downOnLayer.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (downOnLayer.current && e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={panel} className="search-panel paper" role="dialog" aria-modal="true" aria-label="Поиск" tabIndex={-1} onKeyDown={onKeyDown}>
        <div className="search-head">
          <label className="search-icon" htmlFor={`${uid}-q`}>
            <IconSearch size={20} />
            <span className="visually-hidden">Поиск по курсу и книге</span>
          </label>
          <input
            ref={input}
            id={`${uid}-q`}
            className="search-input"
            type="search"
            placeholder="Термин, цитата или тема — например, RLS"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (body.current) body.current.scrollTop = 0
            }}
          />
          <button type="button" className="btn search-close" aria-label="Закрыть" onClick={onClose}>
            <IconClose size={20} />
          </button>
        </div>

        <div ref={body} className="search-body">
          <p className="search-status" aria-live="polite">
            {status}
          </p>
          {!results ? (
            <div className="search-examples">
              <p className="search-examples-title">Например:</p>
              {EXAMPLES.map((w) => (
                <button
                  key={w}
                  type="button"
                  className="btn search-example"
                  onClick={() => {
                    setQuery(w)
                    input.current?.focus()
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          ) : (
            // key — запрос: новая выдача начинается свёрнутой
            <div key={query} className="search-groups">
              {results.terms.length > 0 && (
                <Group
                  id={`${uid}-terms`}
                  title="Термины"
                  hits={results.terms}
                  render={(hit) => {
                    const t = hit.entry
                    // определение — целиком, с метками по всему тексту
                    const def = makeSnippet(t.definition, words, Infinity)
                    return (
                      <div className="search-term">
                        <span className="search-title">
                          <Marked text={t.term} marks={hit.titleMarks} />
                        </span>
                        <span className="search-text">
                          <Marked text={def.snippet} marks={def.marks} />
                        </span>
                        {(t.bookRef || t.day !== undefined) && (
                          <span className="search-links">
                            {t.bookRef && (
                              <a className="search-link" href={`book.html#${t.bookRef}`} target="_blank" rel="noopener">
                                <IconBook size={16} />В книге
                              </a>
                            )}
                            {t.day !== undefined && (
                              <a
                                className="search-link"
                                href={`#/day/${t.day}`}
                                onClick={(e) => {
                                  if (!plainClick(e)) return
                                  e.preventDefault()
                                  go({ day: t.day!, anchor: 'part-summary' })
                                }}
                              >
                                {`День ${t.day}`}
                              </a>
                            )}
                          </span>
                        )}
                      </div>
                    )
                  }}
                />
              )}
              {results.course.length > 0 && (
                <Group
                  id={`${uid}-course`}
                  title="В курсе"
                  hits={results.course}
                  render={(hit) => (
                    <button type="button" className="search-hit" onClick={() => go(hit.entry.target)}>
                      <HitBody label={hit.entry.label} title={hit.entry.title} text={hit.entry.text} hit={hit} />
                    </button>
                  )}
                />
              )}
              {book === 'loading' && <BookNote id={`${uid}-book`} text="Загружаю книгу…" />}
              {book === 'failed' && <BookNote id={`${uid}-book`} text="Поиск по книге сейчас недоступен" />}
              {results.book.length > 0 && (
                <Group
                  id={`${uid}-book`}
                  title="В книге"
                  hits={results.book}
                  render={(hit) => {
                    const { a, c, s, t } = hit.entry
                    return (
                      <a className="search-hit" href={`book.html#${a}`} target="_blank" rel="noopener">
                        <HitBody label={s ? `Книга · ${c} → ${s}` : `Книга · ${c}`} title={s || c} text={t} hit={hit} />
                      </a>
                    )
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
