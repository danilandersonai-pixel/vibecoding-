import { BookLink } from '../components/BookLink'
import { Figure } from '../components/Figure'
import type { Block } from '../content/schema'

type Idea = Extract<Block, { type: 'idea' }>

// Мысль из книги — карточка «бумаги»: кикер «Мысль i из n» (номер среди мыслей дня), заголовок, текст Literata, ссылка в книгу
export function IdeaBlock({ block, index }: { block: Idea; index?: { i: number; n: number } }) {
  return (
    <article className="block idea paper">
      <p className="kicker block-kicker">{index ? `Мысль ${index.i} из ${index.n}` : 'Мысль из книги'}</p>
      <h3>{block.title}</h3>
      {block.text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="idea-text">
          {para}
        </p>
      ))}
      {block.figure && <Figure id={block.figure} />}
      {block.bookRef && <BookLink bookRef={block.bookRef} />}
    </article>
  )
}
