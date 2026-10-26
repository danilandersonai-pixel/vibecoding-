import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Figure } from '../components/Figure'
import { IconArrow, IconBook, IconPlay } from '../components/icons'
import { RouteLink } from '../components/RouteLink'
import { goToResult } from '../search/goTo'
import { neighborGroups, nodeActions, TYPE_LABEL, type GraphIndex, type GraphNode, type NeighborGroup } from './model'

// Сколько соседей группы видно сразу; остальные — по «Показать все N»
const LIMIT = 8

// Группа связей: заголовок с числом, кнопки-узлы (у term-text — число упоминаний), первые LIMIT и «Показать все N».
// После раскрытия фокус — на первом новом соседе, как в группах окна поиска
function Group({ group, onSelect }: { group: NeighborGroup; onSelect: (id: string) => void }) {
  const id = useId()
  const [all, setAll] = useState(false)
  const list = useRef<HTMLUListElement>(null)
  const focusNext = useRef(false)
  useEffect(() => {
    if (!all || !focusNext.current) return
    focusNext.current = false
    list.current?.children[LIMIT]?.querySelector<HTMLElement>('button')?.focus()
  }, [all])
  const shown = all ? group.items : group.items.slice(0, LIMIT)
  return (
    <section className="graph-group" aria-labelledby={id}>
      <h3 id={id} className="graph-group-title">
        {group.title} <span className="graph-count">{group.items.length}</span>
      </h3>
      <ul ref={list} className="graph-list">
        {shown.map(({ node, w }) => (
          <li key={node.id}>
            <button type="button" className="graph-node" onClick={() => onSelect(node.id)}>
              {node.label}
              {group.kind === 'term-text' && w !== undefined && (
                <>
                  {' '}
                  <span className="graph-node-w">· {w}</span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
      {!all && group.items.length > LIMIT && (
        <button
          type="button"
          className="btn graph-more"
          onClick={() => {
            focusNext.current = true
            setAll(true)
          }}
        >
          {`Показать все ${group.items.length}`}
        </button>
      )}
    </section>
  )
}

// Действия узла: место в книге (новая вкладка), день курса, ролик — в его день к «Теории» тем же механизмом, что в поиске.
// День и ролик — ссылки: с Ctrl/⌘/Shift открываются как обычные
function Actions({ node }: { node: GraphNode }) {
  const { book, day, videoDay } = nodeActions(node)
  if (book === undefined && day === undefined && videoDay === undefined) return null
  return (
    <div className="graph-actions">
      {book !== undefined && (
        <a className="btn" href={`book.html#${book}`} target="_blank" rel="noopener">
          <IconBook size={18} />
          Открыть в книге
        </a>
      )}
      {day !== undefined && (
        <RouteLink to={`#/day/${day}`} className="btn">
          Открыть день
          <IconArrow size={18} />
        </RouteLink>
      )}
      {videoDay !== undefined && (
        <a
          className="btn"
          href={`#/day/${videoDay}`}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
            e.preventDefault()
            goToResult({ day: videoDay, anchor: 'part-theory' })
          }}
        >
          <IconPlay size={18} />
          Смотреть ролик
        </a>
      )}
    </div>
  )
}

// Карточка узла графа: кикер-тип, название, короткий текст (у схемы — миниатюра), действия, группы связей (§3).
// Без узла (или с неизвестным id) — подсказка. Узел выбран кнопкой из самой карточки — фокус переходит на название
// нового узла: нажатая кнопка уходит вместе со старой карточкой. Выбор с рисунка или из поиска фокус не трогает
export function NodeCard({ index, id, onSelect }: { index: GraphIndex; id?: string | null; onSelect: (id: string) => void }) {
  const node = id == null ? undefined : index.byId.get(id)
  const groups = useMemo(() => (node ? neighborGroups(index, node.id) : []), [index, node])
  const title = useRef<HTMLHeadingElement>(null)
  const pickedHere = useRef<string | null>(null)
  useEffect(() => {
    if (node && pickedHere.current === node.id) title.current?.focus()
    pickedHere.current = null
  }, [node])

  const pick = (next: string) => {
    pickedHere.current = next
    onSelect(next)
  }

  return (
    <aside className="graph-card paper" aria-label="Узел графа">
      {node ? (
        // key — узел: у карточки нового узла все группы снова свёрнуты
        <div key={node.id}>
          <p className="kicker">{TYPE_LABEL[node.type]}</p>
          <h2 ref={title} className="graph-card-title" tabIndex={-1}>
            {node.label}
          </h2>
          {node.text !== '' && <p className="graph-card-text">{node.text}</p>}
          {node.figure !== undefined && (
            <div className="graph-card-figure">
              <Figure id={node.figure} />
            </div>
          )}
          <Actions node={node} />
          {/* ключ — вид и подпись: у взаимных term-term две группы одного вида, у трёх «В курсе» один заголовок и разные виды */}
          {groups.map((g) => (
            <Group key={`${g.kind}:${g.title}`} group={g} onSelect={pick} />
          ))}
        </div>
      ) : (
        <p className="graph-card-hint">Выберите узел на графе или найдите его поиском</p>
      )}
    </aside>
  )
}
