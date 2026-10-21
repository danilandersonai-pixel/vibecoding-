import { DiagramBlock } from '../blocks/DiagramBlock'
import { IdeaBlock } from '../blocks/IdeaBlock'
import type { Block } from '../content/schema'

// Переключатель блоков теории по типу. Блоки без своего компонента пока показываются заглушкой.
export function BlockView({ block }: { block: Block; dayId: string }) {
  switch (block.type) {
    case 'idea':
      return <IdeaBlock block={block} />
    case 'diagram':
      return <DiagramBlock block={block} />
    default:
      return (
        <div className="block block-soon">
          <p className="block-soon-title">{'title' in block ? block.title : 'Блок'}</p>
          <p className="soon">Скоро</p>
        </div>
      )
  }
}
