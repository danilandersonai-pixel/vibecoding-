import { useCurrentFrame } from 'remotion'
import { easeOut } from '../motion'
import { fitText } from '../text'
import { HEADER, MONO, MOTION, SAFE, T } from '../theme'
import { BASELINE, CELL, LEFT, RIGHT, cellsFor, titleRoom } from './layout'

type Props = {
  /** id ролика, например «ch-abc». */
  lessonId: string
  /** Текущая глава: номер с единицы, сколько всего и название. */
  chapter: { n: number; total: number; title: string }
  /** Ссылка на книгу справа (bookRef); пустая строка — справа ничего. */
  book: string
  /** Сколько px справа занято тем, что рисует не шапка (метки ошибки, ссылка на книгу сцены — HeaderBook), если book пуст. */
  reserve?: number
  /** Кадр, на котором началась эта глава (в той же шкале, что useCurrentFrame): 12 кадров номер прокручивается, а полоса главы переезжает. */
  at: number
}

const pad = (n: number) => String(n).padStart(2, '0')

// Номер главы прокручивается на столько px: старый уходит вверх за край полосы, новый приходит снизу.
const ROLL = 40
const STRIP = { h: 2, gap: 6 }

const text = { fontFamily: T.mono, fontSize: MONO.size, fontWeight: 500, fontVariantLigatures: 'none' } as const

// Шапка кадра (y 32–80, Martian Mono 24 px, faint): слева ролик и глава «02/07 · Git: история проекта», справа ссылка на книгу.
// Под текстом — полоса глав: по сегменту на главу, текущая ink. Рисуется <g> поверх общего <svg viewBox="0 0 1920 1080">.
export function Header({ lessonId, chapter, book, reserve = 0, at }: Props) {
  const frame = useCurrentFrame()
  const p = easeOut((frame - at) / MOTION.chapter)
  const rolling = chapter.n > 1 && p < 1

  const numberX = LEFT + (lessonId.length + 2) * CELL
  const restX = numberX + 2 * CELL
  // Названию остаётся то, что не заняли id, номер, «/07 · » и правая часть (с промежутком в три знака).
  const right = book ? [...book].length : cellsFor(reserve)
  const title = fitText(chapter.title, Math.max(1, titleRoom(lessonId, right)))

  const segW = (SAFE.w - STRIP.gap * (chapter.total - 1)) / chapter.total
  const segX = (i: number) => LEFT + i * (segW + STRIP.gap)
  const stripY = HEADER.y + HEADER.h - STRIP.h
  const current = chapter.n - 1
  const inkX = rolling ? segX(current - 1) + (segX(current) - segX(current - 1)) * p : segX(current)

  return (
    <g>
      <clipPath id="term-header-number">
        <rect x={numberX} y={HEADER.y} width={2 * CELL} height={HEADER.h} />
      </clipPath>
      <text x={LEFT} y={BASELINE} fill={T.faint} style={text}>
        {lessonId}
      </text>
      <g clipPath="url(#term-header-number)">
        {rolling && (
          <text x={numberX} y={BASELINE} fill={T.faint} style={text} transform={`translate(0 ${-p * ROLL})`}>
            {pad(chapter.n - 1)}
          </text>
        )}
        <text x={numberX} y={BASELINE} fill={T.faint} style={text} transform={`translate(0 ${rolling ? (1 - p) * ROLL : 0})`}>
          {pad(chapter.n)}
        </text>
      </g>
      <text x={restX} y={BASELINE} fill={T.faint} style={text} opacity={rolling ? p : 1}>
        {`/${pad(chapter.total)} · ${title}`}
      </text>
      {book && <HeaderBook text={book} />}
      {Array.from({ length: chapter.total }, (_, i) => (
        <rect key={i} x={segX(i)} y={stripY} width={segW} height={STRIP.h} fill={i < current ? T.faint : T.grid} />
      ))}
      <rect x={inkX} y={stripY} width={segW} height={STRIP.h} fill={T.ink} />
    </g>
  )
}

/** Ссылка на книгу справа в шапке. Урок рисует её внутри сцены (растворяется вместе со сценой, как метки ошибки), а шапке даёт reserve. */
export function HeaderBook({ text: book }: { text: string }) {
  return (
    <text x={RIGHT} y={BASELINE} fill={T.faint} style={text} textAnchor="end">
      {book}
    </text>
  )
}
