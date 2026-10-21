import { BookLink } from '../components/BookLink'
import { Figure } from '../components/Figure'
import type { Block } from '../content/schema'

type Idea = Extract<Block, { type: 'idea' }>

export function IdeaBlock({ block }: { block: Idea }) {
  return (
    <div className="block idea">
      <h3>{block.title}</h3>
      {block.text.split(/\n{2,}/).map((para, i) => (
        <p key={i}>{para}</p>
      ))}
      {block.figure && <Figure id={block.figure} />}
      {block.bookRef && <BookLink bookRef={block.bookRef} />}
    </div>
  )
}
