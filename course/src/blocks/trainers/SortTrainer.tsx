import { useState, type DragEvent } from 'react'
import type { Block } from '../../content/schema'
import { useCourseProgress } from '../../progress/courseProgress'
import { setTrainerDone } from '../../progress/model'
import { evaluateSort } from './evaluate'

type Trainer = Extract<Block, { kind: 'sort' }>

// Раскладка по корзинам: перетаскиванием на компьютере или кнопками корзин на телефоне.
export function SortTrainer({ block, dayId }: { block: Trainer; dayId: string }) {
  const { update } = useCourseProgress()
  const [placed, setPlaced] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof evaluateSort> | null>(null)

  function place(itemId: string, bucketId: string) {
    setResult(null)
    setPlaced({ ...placed, [itemId]: bucketId })
  }

  function check() {
    const r = evaluateSort(block.items, placed)
    setResult(r)
    if (r.wrong.length === 0) update((p) => setTrainerDone(p, dayId, block.id, true))
  }

  const onDrop = (bucketId: string) => (e: DragEvent) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain')
    if (itemId) place(itemId, bucketId)
  }

  const itemState = (id: string) => (!result ? '' : result.correct.includes(id) ? ' is-found' : ' is-wrong')

  function renderItem({ id, text }: { id: string; text: string }) {
    return (
      <li key={id} className={`sort-item${itemState(id)}`} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', id)}>
        <span>{text}</span>
        <span className="sort-pick" role="group" aria-label={`Куда отнести: ${text}`}>
          {block.buckets.map((b) => (
            <button key={b.id} type="button" aria-pressed={placed[id] === b.id} onClick={() => place(id, b.id)}>
              {b.label}
            </button>
          ))}
        </span>
      </li>
    )
  }

  const unplaced = block.items.filter((i) => !placed[i.id])
  return (
    <div className="block trainer">
      <h3>{block.title}</h3>
      {unplaced.length > 0 && (
        <ul className="sort-pool">
          {unplaced.map(renderItem)}
        </ul>
      )}
      <div className="sort-buckets">
        {block.buckets.map((b) => (
          <section key={b.id} className="sort-bucket" onDragOver={(e) => e.preventDefault()} onDrop={onDrop(b.id)}>
            <h4>{b.label}</h4>
            <ul>
              {block.items
                .filter((i) => placed[i.id] === b.id)
                .map(renderItem)}
            </ul>
          </section>
        ))}
      </div>
      <button type="button" className="btn" onClick={check} disabled={unplaced.length > 0}>
        Проверить
      </button>
      {result && (
        <p className={`trainer-result${result.wrong.length === 0 ? ' is-ok' : ''}`} role="status">
          {result.wrong.length === 0 ? 'Всё разложено верно.' : `Верно: ${result.correct.length} из ${block.items.length}. Красным — то, что стоит переложить.`}
        </p>
      )}
    </div>
  )
}
