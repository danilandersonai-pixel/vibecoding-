import type { Block, Day } from '../content/schema'

// Записи для поиска: материалы курса и термины словаря. Чистые функции, без React и без загрузки данных —
// дни и словарь приходят параметрами.

// Куда ведёт результат: день и id элемента на его странице — `block-<id блока>` или часть дня (`part-<id части>`)
export type SearchTarget = { day: number; anchor: string }

export type CourseEntryKind = 'day' | 'idea' | 'diagram' | 'video' | 'trainer' | 'scenario' | 'ai' | 'quiz' | 'practice' | 'mentor'

export type CourseEntry = {
  kind: CourseEntryKind
  label: string // подпись над названием: «День 1 · Мысль»
  title: string
  text: string // может быть пустым (ролик, вопрос наставника без пояснения)
  target: SearchTarget
}

export type TermEntry = { term: string; definition: string; bookRef?: string; day?: number }

// Запись словаря книги (course/content/glossary.json)
export type GlossaryItem = { term: string; definition: string; refs: string[] }

const KIND_LABEL: Record<CourseEntryKind, string> = {
  day: 'Тема дня',
  idea: 'Мысль',
  diagram: 'Схема',
  video: 'Видеоурок',
  trainer: 'Тренажёр',
  scenario: 'Ситуация',
  ai: 'Спросите ИИ',
  quiz: 'Тест',
  practice: 'Практика',
  mentor: 'Наставник',
}

// Предложения подряд: каждому без знака в конце добавляется точка
function sentences(parts: (string | undefined)[]): string {
  return parts
    .filter((p): p is string => Boolean(p))
    .map((p) => (/[.!?…]$/.test(p) ? p : `${p}.`))
    .join(' ')
}

function list(parts: string[]): string {
  return parts.filter(Boolean).join(' · ')
}

// Тексты блоков теории. Ответы тренажёров и скрытая подсказка помощника ИИ в поиск не попадают
function blockFields(b: Block): { kind: CourseEntryKind; title: string; text: string } {
  switch (b.type) {
    case 'idea':
      return { kind: 'idea', title: b.title, text: b.text }
    case 'diagram':
      return { kind: 'diagram', title: b.caption, text: (b.steps ?? []).join(' ') }
    case 'video':
      return { kind: 'video', title: b.title, text: '' }
    case 'trainer':
      if (b.kind === 'prompt-builder') return { kind: 'trainer', title: 'Собери запрос', text: b.task }
      if (b.kind === 'find-the-bug') return { kind: 'trainer', title: b.title, text: b.lines.map((l) => l.trim()).filter(Boolean).join(' ') }
      return { kind: 'trainer', title: b.title, text: list([...b.buckets.map((x) => x.label), ...b.items.map((x) => x.text)]) }
    case 'scenario':
      return { kind: 'scenario', title: b.title, text: b.nodes[b.start]?.text ?? '' }
    case 'ai-helper':
      return { kind: 'ai', title: b.title, text: b.placeholder }
  }
}

// Записи курса в порядке источника: дни по порядку, внутри дня — как на странице (тема, теория, тест, практика, наставник)
export function courseEntries(days: Day[]): CourseEntry[] {
  return days.flatMap((d) => {
    const entry = (kind: CourseEntryKind, title: string, text: string, anchor: string): CourseEntry => ({
      kind,
      label: `День ${d.number} · ${KIND_LABEL[kind]}`,
      title,
      text,
      target: { day: d.number, anchor },
    })
    return [
      entry('day', d.title, sentences([d.goal, d.result]), 'part-why'),
      ...d.blocks.map((b) => {
        const f = blockFields(b)
        // ролик без id — к части «Теория»; у остальных блоков id есть, и он стоит на самом блоке
        return entry(f.kind, f.title, f.text, 'id' in b ? `block-${b.id}` : 'part-theory')
      }),
      ...d.quiz.map((q) => entry('quiz', q.question, sentences([list(q.options), q.explanation]), 'part-quiz')),
      ...d.practice.map((s) => entry('practice', s.title, sentences([s.prompt, `Готово, когда: ${s.done}`]), 'part-practice')),
      ...d.mentor.checklist.map((c) => entry('mentor', c.text, 'Пункт проверки наставника', 'part-mentor')),
      ...d.mentor.questions.map((q) => entry('mentor', q, 'Вопрос наставника', 'part-mentor')),
    ]
  })
}

// Термины словаря: bookRef — первая ссылка на книгу, day — первый день, в карточках которого есть термин
export function termEntries(glossary: GlossaryItem[], days: Day[]): TermEntry[] {
  const firstDay = new Map<string, number>()
  for (const d of days) {
    for (const t of d.cards) {
      const known = firstDay.get(t)
      if (known === undefined || d.number < known) firstDay.set(t, d.number)
    }
  }
  return glossary.map((g) => {
    const entry: TermEntry = { term: g.term, definition: g.definition }
    if (g.refs[0]) entry.bookRef = g.refs[0]
    const day = firstDay.get(g.term)
    if (day !== undefined) entry.day = day
    return entry
  })
}
