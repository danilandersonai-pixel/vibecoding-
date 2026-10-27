import { useEffect, useRef, useState } from 'react'
import { partsDone, type Part } from '../course/dayParts'
import { plural } from '../course/summary'
import { scrollBehavior, scrollToId } from '../home/scroll'

// Текущая часть — та, что пересекает полосу на трети высоты окна; между частями подсветка остаётся на прежней.
// Без IntersectionObserver (jsdom, старые браузеры) подсветки нет. key меняется, только если меняется набор частей.
function useCurrentSection(key: string): string | null {
  const [current, setCurrent] = useState<string | null>(null)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id^="part-"]'))
    const inBand = new Set<Element>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target)
          else inBand.delete(e.target)
        }
        const first = sections.find((s) => inBand.has(s))
        if (first) setCurrent(first.id)
      },
      { rootMargin: '-30% 0px -65% 0px' },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [key])
  return current
}

// План дня — колонка справа (до 960 px — полоса над частями): шесть частей и счёт сделанного.
// Текущая часть — строка-инверсия, сделанная — зелёная ✓, номер — 01–06 моноширинным. Пункт — кнопка с прокруткой к части (якорь занят маршрутом #/day/N);
// часть без содержания — бледная, с подписью «скоро», не нажимается. У черновика счёта и полосы нет
// (showProgress=false): засчитать день, пока нет остальных частей, нельзя, и «Сделано 1 из 1» вводило бы в заблуждение.
export function DayToc({ parts, showProgress = true }: { parts: Part[]; showProgress?: boolean }) {
  const { done, total } = partsDone(parts)
  const current = useCurrentSection(parts.map((p) => `${p.id}:${p.available}`).join())
  // Полоса «таблеток» (≤ 960 px) сама подкручивается вбок: текущий пункт — к её середине. Прокручиваем только
  // список, не scrollIntoView, — иначе дёрнулась бы страница. Колонка (> 960 px) вбок не прокручивается.
  const listRef = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const list = listRef.current
    const item = list?.querySelector('[aria-current="true"]')
    if (!list || !item || list.scrollWidth <= list.clientWidth) return
    const box = item.getBoundingClientRect()
    const shift = box.left - list.getBoundingClientRect().left
    list.scrollTo({ left: list.scrollLeft + shift - (list.clientWidth - box.width) / 2, behavior: scrollBehavior() })
  }, [current])
  return (
    <nav className="toc" aria-label="План дня">
      <p className="kicker toc-kicker">План дня</p>
      {showProgress && (
        <>
          <div className="toc-bar" aria-hidden="true">
            <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
          <p className="toc-count">{`Сделано ${done} из ${total} ${plural(total, 'части', 'частей', 'частей')}`}</p>
        </>
      )}
      <ol ref={listRef} className="toc-list">
        {parts.map((p, i) => {
          const isCurrent = current === `part-${p.id}`
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`toc-item${p.done ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
                disabled={!p.available}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => scrollToId(`part-${p.id}`)}
              >
                <span className="toc-num" aria-hidden="true">
                  {p.done ? '✓' : String(i + 1).padStart(2, '0')}
                </span>
                <span className="toc-title">{p.title}</span>
                {p.done && <span className="visually-hidden">, сделано</span>}
                {!p.available && <span className="toc-soon">скоро</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
