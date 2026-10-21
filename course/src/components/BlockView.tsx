import type { Block } from '../content/schema'
import { BookLink } from './BookLink'

// Переключатель блоков теории по типу. Блоки без своего компонента пока показываются заглушкой.
export function BlockView({ block }: { block: Block; dayId: string }) {
  switch (block.type) {
    default:
      return (
        <div className="block block-soon">
          <p className="block-soon-title">{'title' in block ? block.title : 'Блок'}</p>
          <p className="soon">Скоро</p>
          {block.type === 'idea' && block.bookRef && <BookLink bookRef={block.bookRef} />}
        </div>
      )
  }
}
