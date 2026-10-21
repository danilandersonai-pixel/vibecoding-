import { DiagramBlock } from '../blocks/DiagramBlock'
import { IdeaBlock } from '../blocks/IdeaBlock'
import { Scenario } from '../blocks/Scenario'
import { FindTheBug } from '../blocks/trainers/FindTheBug'
import { PromptBuilder } from '../blocks/trainers/PromptBuilder'
import { SortTrainer } from '../blocks/trainers/SortTrainer'
import type { Block } from '../content/schema'

// Переключатель блоков теории по типу. Блоки без своего компонента пока показываются заглушкой.
export function BlockView({ block, dayId }: { block: Block; dayId: string }) {
  switch (block.type) {
    case 'idea':
      return <IdeaBlock block={block} />
    case 'diagram':
      return <DiagramBlock block={block} />
    case 'scenario':
      return <Scenario block={block} dayId={dayId} />
    case 'trainer':
      if (block.kind === 'prompt-builder') return <PromptBuilder block={block} dayId={dayId} />
      if (block.kind === 'find-the-bug') return <FindTheBug block={block} dayId={dayId} />
      return <SortTrainer block={block} dayId={dayId} />
    default:
      return (
        <div className="block block-soon">
          <p className="block-soon-title">{'title' in block ? block.title : 'Блок'}</p>
          <p className="soon">Скоро</p>
        </div>
      )
  }
}
