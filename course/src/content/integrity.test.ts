import { describe, expect, it } from 'vitest'
import { DaySchema, type Day } from './schema'

// Проверки содержания, которых нет в схеме: id внутри дня не повторяются, ситуацию можно пройти до хорошей концовки.
// Ответы, галочки и якоря привязаны к id, поэтому повтор ломает день молча; тупик в ситуации тоже не виден без прохождения.

const files = import.meta.glob('../../content/days/*.json', { eager: true, import: 'default' })
const texts = import.meta.glob('../../content/days/*.json', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

// Значения, которые встречаются в списке больше одного раза, — по одному разу
function repeats(ids: string[]): string[] {
  const seen = new Set<string>()
  const twice = new Set<string>()
  for (const id of ids) (seen.has(id) ? twice : seen).add(id)
  return [...twice]
}

// Каждый список — своё пространство id: шаг и пункт наставника могут называться одинаково, два шага — нет.
// Вопросы теста дня и теста недели — один список.
// Термины дня, вопросы наставника, подписи выборов в узле ситуации и варианты части запроса — тоже id: по ним React
// ставит ключи списков (Cards, MentorBlock, Scenario, PromptBuilder), а выбор ситуации ещё и запоминается по подписи
function idProblems(day: Day): string[] {
  const out: string[] = []
  const check = (where: string, ids: string[]) => {
    for (const id of repeats(ids)) out.push(`${where}: повтор id «${id}»`)
  }
  check('блоки', day.blocks.flatMap((b) => ('id' in b ? [b.id] : [])))
  check('вопросы', [...day.quiz, ...day.weekTest].map((q) => q.id))
  check('шаги практики', day.practice.map((s) => s.id))
  check('пункты наставника', day.mentor.checklist.map((c) => c.id))
  check('вопросы наставника', day.mentor.questions)
  check('карточки', day.cards)
  for (const b of day.blocks) {
    if (b.type === 'diagram') check(`${b.id}: точки схемы`, b.hotspots.map((h) => h.id))
    if (b.type === 'trainer' && b.kind === 'sort') {
      check(`${b.id}: корзины`, b.buckets.map((x) => x.id))
      check(`${b.id}: карточки`, b.items.map((x) => x.id))
    }
    if (b.type === 'trainer' && b.kind === 'prompt-builder') {
      check(`${b.id}: части запроса`, b.parts.map((p) => p.key))
      for (const p of b.parts) check(`${b.id}: варианты части «${p.key}»`, [...p.good, ...p.bad])
    }
    if (b.type === 'scenario') for (const [name, node] of Object.entries(b.nodes)) check(`${b.id}: выборы узла «${name}»`, node.choices.map((c) => c.label))
  }
  return out
}

// Повторы ключей внутри одного объекта JSON. JSON.parse молча оставляет последний ключ,
// поэтому два узла ситуации с одним именем видны только в тексте файла
function duplicateKeys(text: string): string[] {
  const out: string[] = []
  const stack: (Set<string> | null)[] = [] // объект — его ключи, массив — null
  let expectKey = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      let j = i + 1
      while (text[j] !== '"') j += text[j] === '\\' ? 2 : 1
      const keys = stack[stack.length - 1]
      if (keys && expectKey) {
        const key = JSON.parse(text.slice(i, j + 1)) as string
        if (keys.has(key)) out.push(key)
        else keys.add(key)
        expectKey = false
      }
      i = j
    } else if (ch === '{') {
      stack.push(new Set())
      expectKey = true
    } else if (ch === '[') stack.push(null)
    else if (ch === '}' || ch === ']') stack.pop()
    else if (ch === ',') expectKey = Boolean(stack[stack.length - 1])
  }
  return out
}

// Ситуация проходима: у развилки есть выбор, у концовки выбора нет (его не покажут), от старта можно дойти до «good»
function scenarioProblems(day: Day): string[] {
  const out: string[] = []
  for (const b of day.blocks) {
    if (b.type !== 'scenario') continue
    for (const [name, node] of Object.entries(b.nodes)) {
      if (!node.ending && node.choices.length === 0) out.push(`${b.id}: узел «${name}» без выбора и без концовки`)
      if (node.ending && node.choices.length > 0) out.push(`${b.id}: у концовки «${name}» есть выбор`)
    }
    const reached = new Set([b.start])
    for (const name of reached) for (const c of b.nodes[name]?.choices ?? []) reached.add(c.next)
    if (![...reached].some((name) => b.nodes[name]?.ending === 'good')) out.push(`${b.id}: из «${b.start}» не дойти до хорошей концовки`)
  }
  return out
}

const DAY1 = '../../content/days/day-01.json'
const day1 = () => structuredClone(DaySchema.parse(files[DAY1]))
const scenarioOf = (day: Day) => {
  const sc = day.blocks.find((b) => b.type === 'scenario')
  if (!sc) throw new Error('в дне 1 нет ситуации')
  return sc
}
const sortOf = (day: Day) => {
  const sort = day.blocks.find((b) => b.type === 'trainer' && b.kind === 'sort')
  if (!sort) throw new Error('в дне 1 нет сортировки')
  return sort
}

describe('целостность дней content/days', () => {
  for (const [path, data] of Object.entries(files)) {
    const day = DaySchema.parse(data)
    it(`${path}: все id внутри дня уникальны`, () => {
      expect(idProblems(day)).toEqual([])
      expect(duplicateKeys(texts[path])).toEqual([])
    })
    it(`${path}: ситуация проходима`, () => {
      expect(scenarioProblems(day)).toEqual([])
    })
  }
})

describe('проверка уникальности id ловит повтор (копия дня 1)', () => {
  it('день 1 сейчас проходит', () => {
    expect(idProblems(day1())).toEqual([])
  })

  const cases: [string, (d: Day) => void, RegExp][] = [
    ['блок', (d) => Object.assign(d.blocks.find((b) => b.type === 'idea')!, { id: 'restaurant-map' }), /блоки: повтор id «restaurant-map»/],
    ['вопрос теста', (d) => (d.quiz[1].id = d.quiz[0].id), /вопросы: повтор id «q-backend»/],
    ['вопрос теста дня и теста недели', (d) => (d.weekTest = [{ ...d.quiz[2] }]), /вопросы: повтор id «q-vibe»/],
    ['шаг практики', (d) => (d.practice[2].id = d.practice[1].id), /шаги практики: повтор id «repo»/],
    ['пункт наставника', (d) => (d.mentor.checklist[1].id = d.mentor.checklist[0].id), /пункты наставника: повтор id «commit»/],
    ['карточка тренажёра', (d) => (sortOf(d).items[1].id = sortOf(d).items[0].id), /modes-sort: карточки: повтор id «proto»/],
    ['корзина тренажёра', (d) => (sortOf(d).buckets[1].id = sortOf(d).buckets[0].id), /modes-sort: корзины: повтор id «vibe»/],
    [
      'часть запроса',
      (d) => d.blocks.push({ type: 'trainer', kind: 'prompt-builder', id: 'pb', task: 'Т', parts: [0, 1].map(() => ({ key: 'goal' as const, label: 'Цель', good: ['а'], bad: [] })) }),
      /pb: части запроса: повтор id «goal»/,
    ],
    ['точка схемы', (d) => (d.blocks.find((b) => b.type === 'diagram')!.hotspots[1].id = 'hall'), /restaurant-map: точки схемы: повтор id «hall»/],
    ['карточка дня', (d) => d.cards.push(d.cards[0]), /^карточки: повтор id «Фронтенд»$/],
    [
      'выбор в узле ситуации',
      (d) => {
        const sc = scenarioOf(d)
        const node = sc.nodes[sc.start]
        node.choices[1].label = node.choices[0].label
      },
      /^pick-model: выборы узла «start»: повтор id «Самую мощную — на все задачи подряд»$/,
    ],
    ['вопрос наставника', (d) => d.mentor.questions.push(d.mentor.questions[0]), /^вопросы наставника: повтор id «/],
    [
      'вариант части запроса',
      (d) => d.blocks.push({ type: 'trainer', kind: 'prompt-builder', id: 'pb', task: 'Т', parts: [{ key: 'goal', label: 'Цель', good: ['а'], bad: ['а'] }] }),
      /^pb: варианты части «goal»: повтор id «а»$/,
    ],
  ]
  it.each(cases)('повтор: %s', (_, spoil, problem) => {
    const day = day1()
    spoil(day)
    expect(idProblems(day)).toEqual([expect.stringMatching(problem)])
  })

  it('повтор узла ситуации в JSON: JSON.parse молча оставил бы только последний', () => {
    // Узел «expensive» переименован в «arena» — второй ключ «arena» в том же объекте nodes
    const text = texts[DAY1].replace('"expensive": {', '"arena": {')
    expect(text).not.toBe(texts[DAY1])
    expect(duplicateKeys(text)).toEqual(['arena'])
  })
})

describe('проверка ситуации ловит, что её не пройти (копия дня 1)', () => {
  it('день 1 сейчас проходит', () => {
    expect(scenarioProblems(day1())).toEqual([])
  })

  it('убран путь к хорошей концовке → ошибка, хотя схема день принимает', () => {
    const day = day1()
    const sc = scenarioOf(day)
    const good = Object.keys(sc.nodes).filter((n) => sc.nodes[n].ending === 'good')
    const bad = Object.keys(sc.nodes).find((n) => sc.nodes[n].ending === 'bad')!
    for (const node of Object.values(sc.nodes)) for (const c of node.choices) if (good.includes(c.next)) c.next = bad
    expect(DaySchema.safeParse(day).success).toBe(true)
    expect(scenarioProblems(day)).toEqual([`pick-model: из «${sc.start}» не дойти до хорошей концовки`])
  })

  it('узел без концовки и без выбора — тупик', () => {
    const day = day1()
    const sc = scenarioOf(day)
    const [name] = Object.keys(sc.nodes).filter((n) => !sc.nodes[n].ending && n !== sc.start)
    sc.nodes[name].choices = []
    expect(DaySchema.safeParse(day).success).toBe(true)
    expect(scenarioProblems(day)).toContain(`pick-model: узел «${name}» без выбора и без концовки`)
  })

  it('у концовки есть выбор — его не покажут', () => {
    const day = day1()
    const sc = scenarioOf(day)
    const name = Object.keys(sc.nodes).find((n) => sc.nodes[n].ending)!
    sc.nodes[name].choices = [{ label: 'Ещё раз', next: sc.start }]
    expect(DaySchema.safeParse(day).success).toBe(true)
    expect(scenarioProblems(day)).toEqual([`pick-model: у концовки «${name}» есть выбор`])
  })
})
