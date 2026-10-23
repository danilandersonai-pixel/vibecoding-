import { AiHelper } from '../blocks/AiHelper'
import { DiagramBlock } from '../blocks/DiagramBlock'
import { IdeaBlock } from '../blocks/IdeaBlock'
import { Scenario } from '../blocks/Scenario'
import { FindTheBug } from '../blocks/trainers/FindTheBug'
import { PromptBuilder } from '../blocks/trainers/PromptBuilder'
import { SortTrainer } from '../blocks/trainers/SortTrainer'
import type { Block } from '../content/schema'
import { VideoBlock } from '../video/VideoBlock'

// Переключатель блоков теории по типу.
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
    case 'video':
      return <VideoBlock videoId={block.videoId} title={block.title} />
    case 'ai-helper':
      return <AiHelper block={block} />
  }
}
