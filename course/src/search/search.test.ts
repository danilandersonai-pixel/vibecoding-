import { describe, expect, it } from 'vitest'
import bookIndex from '../../content/book-index.json'
import glossary from '../../content/glossary.json'
import graph from '../../content/graph.json'
import { getDays } from '../content/load'
import { DaySchema, type Day } from '../content/schema'
import { courseEntries, termEntries, type CourseEntry, type TermEntry } from './courseIndex'
import { fold, normalize, queryWords } from './normalize'
import { makeSnippet, searchBook, searchCourse, searchTerms, type BookEntry } from './search'

// Запись курса для проверок поиска: нужны только название и текст
function course(title: string, text = ''): CourseEntry {
  return { kind: 'idea', label: 'День 1 · Мысль', title, text, target: { day: 1, anchor: 'part-theory' } }
}

// Термин словаря для проверок поиска: узел графа не важен
function term(title: string, definition = ''): TermEntry {
  return { term: title, definition, graphId: 'term:1' }
}

// Текст из слов-«заполнителей» и одного искомого слова на заданной позиции
function filler(before: number, word: string, after: number): string {
  return `${'лорем '.repeat(before)}${word} ${'ипсум '.repeat(after)}`.trim()
}

describe('normalize', () => {
  it('«ё» = «е», регистр не важен', () => {
    expect(normalize('Ёлка')).toBe('елка')
    expect(normalize('ЁЛКА')).toBe(normalize('елка'))
    expect(normalize('RLS')).toBe('rls')
  })

  it('кавычки «», тире, дефис и знаки препинания — пробелы, пробелы схлопываются', () => {
    expect(normalize('«RLS-политика» — это правило…')).toBe('rls политика это правило')
    expect(normalize('  a   b \n c ')).toBe('a b c')
    expect(normalize('„x“ "y" (z), w; v: u!')).toBe('x y z w v u')
  })

  it('«RLS-политика» и «RLS политика» — один и тот же текст', () => {
    expect(normalize('RLS-политика')).toBe(normalize('RLS политика'))
  })

  it('fold сохраняет длину строки (позиции меток), даже с «ё», «…» и символами вне BMP', () => {
    for (const s of ['Ёлка «в» лесу…', 'RLS-политика — это ёжик', 'смайл 😀 и текст', 'İstanbul ß', '\n\tкод();\n']) {
      expect(fold(s)).toHaveLength(s.length)
    }
    expect(fold('Ёлка «в»…')).toBe('елка  в  ')
  })
})

describe('queryWords', () => {
  it('слишком короткий запрос — пустой массив', () => {
    expect(queryWords('  r ')).toEqual([])
    expect(queryWords('')).toEqual([])
    expect(queryWords('    ')).toEqual([])
    expect(queryWords('«»—')).toEqual([])
    expect(queryWords(' ё ')).toEqual([])
  })

  it('делит на слова по нормализованному тексту', () => {
    expect(queryWords('rls')).toEqual(['rls'])
    expect(queryWords('  RLS-политика ')).toEqual(['rls', 'политика'])
    expect(queryWords('«Ёлка» — ёжик')).toEqual(['елка', 'ежик'])
  })
})

describe('поиск: совпадение', () => {
  it('короткий запрос ничего не ищет', () => {
    expect(searchCourse('r', [course('r')])).toEqual([])
    expect(searchTerms('  ', [term('x')])).toEqual([])
  })

  it('запись подходит, только если нашлось каждое слово запроса (И), в названии или в тексте', () => {
    const entries = [
      course('Политика доступа', 'Правила RLS в базе'),
      course('Только политика', 'Ничего больше'),
      course('Только RLS'),
      course('Ничего', 'Совсем ничего'),
    ]
    expect(searchCourse('rls политика', entries).map((h) => h.entry.title)).toEqual(['Политика доступа'])
    expect(searchCourse('политика', entries).map((h) => h.entry.title)).toEqual(['Политика доступа', 'Только политика'])
  })

  it('слово — подстрока: часть слова находит слово целиком', () => {
    expect(searchTerms('репоз', [term('Репозиторий'), term('Коммит')]).map((h) => h.entry.term)).toEqual(['Репозиторий'])
  })

  it('«ё», регистр, кавычки и дефис в запросе не мешают', () => {
    const terms = [term('Ёлка'), term('RLS политика'), term('Политика RLS-доступа')]
    expect(searchTerms('елка', terms).map((h) => h.entry.term)).toEqual(['Ёлка'])
    expect(searchTerms('ЁЛКА', terms).map((h) => h.entry.term)).toEqual(['Ёлка'])
    expect(searchTerms('«ёлка»', terms).map((h) => h.entry.term)).toEqual(['Ёлка'])
    expect(searchTerms('RLS-политика', terms).map((h) => h.entry.term)).toEqual(['RLS политика', 'Политика RLS-доступа'])
    expect(searchTerms('rls политика', [term('RLS-политика')]).map((h) => h.entry.term)).toEqual(['RLS-политика'])
  })

  it('слова запроса не склеиваются через границу названия и текста', () => {
    // «ab» в конце названия и «cd» в начале текста — это не «abcd»
    expect(searchCourse('abcd', [course('xab', 'cdx')])).toEqual([])
  })
})

describe('поиск: порядок', () => {
  it('точное название → начало названия → все слова в названии → только в тексте; при равенстве — порядок источника', () => {
    const entries = [
      course('Текст 1', 'тут говорится про агент и его работу'),
      course('Работа агента', 'про другое'),
      course('Агент и его роль', 'про другое'),
      course('Агент', 'про другое'),
      course('Текст 2', 'ещё один агент в тексте'),
      course('Агентный режим'),
      course('Режим агента (агент)'),
    ]
    expect(searchCourse('агент', entries).map((h) => h.entry.title)).toEqual([
      'Агент',
      'Агент и его роль',
      'Агентный режим',
      'Работа агента',
      'Режим агента (агент)',
      'Текст 1',
      'Текст 2',
    ])
  })

  it('точное название сравнивается после нормализации', () => {
    const entries = [course('Агент и роль'), course('«Ёлка» — тест'), course('Елка тест')]
    expect(searchCourse('елка тест', entries).map((h) => h.entry.title)).toEqual(['«Ёлка» — тест', 'Елка тест'])
    expect(searchCourse('  АГЕНТ ', [course('Не он', 'агент'), course('Агент.')]).map((h) => h.entry.title)).toEqual(['Агент.', 'Не он'])
  })

  it('несколько слов: все в названии выше, чем часть в названии и часть в тексте', () => {
    const entries = [course('Первое', 'база и политика'), course('База и политика доступа'), course('Политика', 'база')]
    expect(searchCourse('база политика', entries).map((h) => h.entry.title)).toEqual(['База и политика доступа', 'Первое', 'Политика'])
  })
})

describe('поиск: метки и фрагмент', () => {
  it('titleMarks — диапазоны [начало, конец) в исходном названии, с «ё» и «»', () => {
    const title = '«Ёлка» и ёжик: RLS-политика'
    const [hit] = searchCourse('елка политика', [course(title)])
    expect(hit.titleMarks.map(([a, b]) => title.slice(a, b))).toEqual(['Ёлка', 'политика'])
    expect(hit.titleMarks).toEqual([
      [1, 5],
      [19, 27],
    ])
  })

  it('метки отмечают все вхождения всех слов и сливают пересекающиеся', () => {
    const [hit] = searchCourse('аб бв', [course('абв аб абв')])
    expect(hit.titleMarks).toEqual([
      [0, 3],
      [4, 6],
      [7, 10],
    ])
    expect(hit.titleMarks.map(([a, b]) => 'абв аб абв'.slice(a, b))).toEqual(['абв', 'аб', 'абв'])
  })

  it('слова, которых нет в названии, меток в названии не дают; совпадение в тексте — метки во фрагменте', () => {
    const [hit] = searchCourse('агент', [course('Название', 'Текст про агента')])
    expect(hit.titleMarks).toEqual([])
    expect(hit.snippet).toBe('Текст про агента')
    expect(hit.snippetMarks).toEqual([[10, 15]])
  })

  it('у записи без текста фрагмент пустой', () => {
    const [hit] = searchCourse('агент', [course('Агент')])
    expect(hit.snippet).toBe('')
    expect(hit.snippetMarks).toEqual([])
    expect(hit.titleMarks).toEqual([[0, 5]])
  })

  it('короткий текст — целиком, без «…»', () => {
    expect(makeSnippet('Агент читает файлы.', ['файл'])).toEqual({ snippet: 'Агент читает файлы.', marks: [[13, 17]] })
  })

  it('длинный текст: совпадение в середине — «…» с двух сторон, не длиннее max, метка стоит на слове', () => {
    const text = filler(60, 'Агентство', 60)
    const { snippet, marks } = makeSnippet(text, ['агент'])
    expect(snippet.startsWith('…')).toBe(true)
    expect(snippet.endsWith('…')).toBe(true)
    expect(snippet.length).toBeLessThanOrEqual(160)
    expect(marks).toHaveLength(1)
    const [a, b] = marks[0]
    expect(snippet.slice(a, b)).toBe('Агент')
    // фрагмент — подстрока текста (без «…» по краям)
    expect(text.includes(snippet.slice(1, -1))).toBe(true)
  })

  it('совпадение в начале текста — «…» только в конце; в конце текста — только в начале', () => {
    const head = makeSnippet(filler(0, 'искомое', 80), ['искомое'])
    expect(head.snippet.startsWith('…')).toBe(false)
    expect(head.snippet.endsWith('…')).toBe(true)
    expect(head.marks).toEqual([[0, 7]])

    const tail = makeSnippet(filler(80, 'искомое', 0), ['искомое'])
    expect(tail.snippet.startsWith('…')).toBe(true)
    expect(tail.snippet.endsWith('…')).toBe(false)
    const [a, b] = tail.marks[0]
    expect(tail.snippet.slice(a, b)).toBe('искомое')
  })

  it('фрагмент не режет слова пополам по краям', () => {
    const { snippet } = makeSnippet(filler(60, 'искомое', 60), ['искомое'])
    const inner = snippet.slice(1, -1)
    expect(inner.split(' ').every((w) => ['лорем', 'ипсум', 'искомое'].includes(w))).toBe(true)
  })

  it('max задаёт длину фрагмента', () => {
    const { snippet } = makeSnippet(filler(40, 'искомое', 40), ['искомое'], 60)
    expect(snippet.length).toBeLessThanOrEqual(60)
    expect(snippet).toContain('искомое')
  })

  it('метки во фрагменте совпадают со словами и после «ё», «…» и «» в тексте перед ними', () => {
    const before = '«Ёжик»… ёж ёлочка — '.repeat(14)
    const text = `${before}Ёлка в лесу ${before}`
    const { snippet, marks } = makeSnippet(text, ['елка'])
    expect(snippet.startsWith('…')).toBe(true)
    expect(marks).toHaveLength(1)
    // метка стоит на «Ёлка» из «Ёлка в лесу», хотя до неё «ё» и «…»: позиции свёрнутого текста = позиции исходного
    expect(snippet.slice(...marks[0])).toBe('Ёлка')
    expect(snippet.slice(marks[0][0], marks[0][0] + 8)).toBe('Ёлка в л')
  })

  it('совпадение только в названии: фрагмент — начало текста, без меток', () => {
    const text = filler(80, 'конец', 0)
    const [hit] = searchCourse('заголовок', [course('Заголовок', text)])
    expect(hit.snippet.startsWith('лорем лорем')).toBe(true)
    expect(hit.snippet.endsWith('…')).toBe(true)
    expect(hit.snippet.length).toBeLessThanOrEqual(160)
    expect(hit.snippetMarks).toEqual([])
  })

  it('окно вокруг самого длинного слова запроса, а не самого раннего: «в» в начале абзаца не уводит фрагмент', () => {
    const text = `в ${'лорем '.repeat(70)}цитатой завершается абзац`
    const { snippet, marks } = makeSnippet(text, ['в', 'цитат'])
    expect(snippet).toContain('цитатой')
    expect(marks.map(([a, b]) => snippet.slice(a, b))).toEqual(['цитат'])
    // то же через поиск: два коротких слова в начале, длинное — в конце
    const [hit] = searchCourse('в на цитат', [course('Абзац', `в начале на старте ${'лорем '.repeat(70)}цитатой завершается абзац`)])
    expect(hit.snippet).toContain('цитатой')
    expect(hit.snippetMarks.map(([a, b]) => hit.snippet.slice(a, b))).toEqual(['цитат'])
  })

  it('при равной длине слов окно — вокруг более раннего вхождения; самое длинное слово, которого нет в тексте, окно не определяет', () => {
    const text = `ббббб ${'лорем '.repeat(70)}ааааа`
    const early = makeSnippet(text, ['ааааа', 'ббббб'])
    expect(early.snippet.startsWith('ббббб')).toBe(true)
    expect(early.snippet).not.toContain('ааааа')
    // «длиннослово» в тексте нет (нашлось бы в названии) — берётся самое длинное из тех, что есть в тексте
    const other = makeSnippet(`ко ${'лорем '.repeat(70)}цитата конец`, ['длиннослово', 'цитата'])
    expect(other.snippet).toContain('цитата')
  })

  it('слова из одного знака должны совпасть (И), но не подсвечиваются ни в названии, ни во фрагменте', () => {
    const entries = [course('Агент в деле', 'Агент работает в сервисе, а не в браузере'), course('Агент', 'Нет такой'), course('Просто', 'ничего')]
    const hits = searchCourse('в агент', entries)
    // «в» есть только в первой записи: И по однознаковому слову работает
    expect(hits.map((h) => h.entry.title)).toEqual(['Агент в деле'])
    const [hit] = hits
    expect(hit.titleMarks.map(([a, b]) => hit.entry.title.slice(a, b))).toEqual(['Агент'])
    expect(hit.snippetMarks.map(([a, b]) => hit.snippet.slice(a, b))).toEqual(['Агент'])
    // запрос из однознаковых слов находит записи, но меток нет совсем
    const [only] = searchCourse('в а', [course('Вода в реке', 'а вот и берег')])
    expect(only.titleMarks).toEqual([])
    expect(only.snippetMarks).toEqual([])
    expect(only.snippet).toBe('а вот и берег')
  })

  it('«…» ставится, только если обрезаны непробельные символы', () => {
    const tail = makeSnippet(`искомое слово${' '.repeat(300)}`, ['искомое'])
    expect(tail.snippet).toBe('искомое слово')
    const lead = makeSnippet(`${' '.repeat(300)}искомое слово`, ['искомое'])
    expect(lead.snippet).toBe('искомое слово')
    expect(lead.marks).toEqual([[0, 7]])
    // а настоящая обрезка по-прежнему с «…»
    expect(makeSnippet(`искомое слово${' '.repeat(300)}конец`, ['искомое']).snippet.endsWith('…')).toBe(true)
  })

  it('слова makeSnippet сворачиваются внутри: регистр, «ё», знаки; пустые слова не зацикливают', () => {
    expect(makeSnippet('Агент читает файлы.', ['Агент'])).toEqual({ snippet: 'Агент читает файлы.', marks: [[0, 5]] })
    expect(makeSnippet('Ёлка в лесу', ['ЕЛКА'])).toEqual({ snippet: 'Ёлка в лесу', marks: [[0, 4]] })
    expect(makeSnippet('Агент читает файлы.', ['', '  ', '«»', 'читает'])).toEqual({ snippet: 'Агент читает файлы.', marks: [[6, 12]] })
    expect(makeSnippet('Агент читает файлы.', [''])).toEqual({ snippet: 'Агент читает файлы.', marks: [] })
  })

  it('края окна не режут суррогатную пару (эмодзи)', () => {
    const lone = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/
    for (const pad of ['', 'я']) {
      const text = `${pad}${'😀'.repeat(150)}яискомое${'😀'.repeat(150)}`
      const { snippet, marks } = makeSnippet(text, ['искомое'])
      expect(snippet).toContain('искомое')
      expect(snippet).not.toMatch(lone)
      expect(snippet.length).toBeLessThanOrEqual(160)
      expect(snippet.slice(...marks[0])).toBe('искомое')
    }
  })

  it('сырые «<» и «&» остаются обычным текстом', () => {
    const t = 'if (a < b && c) { return fn<T>() }'
    const [hit] = searchBook('return', [{ a: 'x', c: 'Глава', s: 'Раздел', t }])
    expect(hit.snippet).toBe(t)
    expect(hit.snippet.slice(...hit.snippetMarks[0])).toBe('return')
  })
})

describe('courseEntries (настоящие дни)', () => {
  const days = getDays()
  const entries = courseEntries(days)
  const day1 = entries.filter((e) => e.target.day === 1)

  it('мысль «Приложение устроено как ресторан» ведёт к своему блоку', () => {
    const idea = entries.find((e) => e.kind === 'idea' && e.title === 'Приложение устроено как ресторан')
    expect(idea?.target).toEqual({ day: 1, anchor: 'block-restaurant' })
    expect(idea?.label).toBe('День 1 · Мысль')
    expect(idea?.text.length).toBeGreaterThan(0)
  })

  it('шаг практики: название в заголовке, запрос и «Готово, когда» в тексте, цель — «Практика»', () => {
    const practice = day1.filter((e) => e.kind === 'practice')
    expect(practice).toHaveLength(days[0].practice.length)
    const first = practice[0]
    expect(first.title).toBe('Установить Claude Code и войти')
    expect(first.label).toBe('День 1 · Практика')
    expect(first.target).toEqual({ day: 1, anchor: 'part-practice' })
    expect(first.text).toContain(days[0].practice[0].prompt)
    expect(first.text).toContain(`Готово, когда: ${days[0].practice[0].done}`)
    for (const e of practice) expect(e.target.anchor).toBe('part-practice')
  })

  it('тест: вопрос — в заголовке, только варианты ответа — в тексте, цель — «Проверка понимания»', () => {
    const quiz = day1.filter((e) => e.kind === 'quiz')
    expect(quiz).toHaveLength(days[0].quiz.length)
    expect(quiz[0].title).toBe(days[0].quiz[0].question)
    expect(quiz[0].text).toBe(days[0].quiz[0].options.join(' · '))
    expect(quiz[0].label).toBe('День 1 · Тест')
    expect(quiz[0].target).toEqual({ day: 1, anchor: 'part-quiz' })
  })

  it('пояснение к вопросу теста не попадает ни в запись, ни в выдачу: на странице оно видно только после ответа', () => {
    const quiz = day1.filter((e) => e.kind === 'quiz')
    days[0].quiz.forEach((q, i) => {
      expect(quiz[i].text).not.toContain(q.explanation)
      // запрос из самого пояснения не находит этот вопрос
      expect(searchCourse(q.explanation, quiz).map((h) => h.entry.title)).not.toContain(q.question)
    })
    // «бэкенд» находит вопрос по вариантам, но во фрагменте нет ответа из пояснения
    const hits = searchCourse('бэкенд', quiz)
    expect(hits.map((h) => h.entry.title)).toContain(days[0].quiz[0].question)
    for (const h of hits) expect(h.snippet).not.toContain('Проверки и расчёты')
  })

  it('наставник: каждый пункт проверки и каждый вопрос — отдельная запись, цель — «Наставник»', () => {
    const mentor = day1.filter((e) => e.kind === 'mentor')
    const { checklist, questions } = days[0].mentor
    expect(mentor).toHaveLength(checklist.length + questions.length)
    expect(mentor.map((e) => e.title)).toEqual([...checklist.map((c) => c.text), ...questions])
    for (const e of mentor) {
      expect(e.label).toBe('День 1 · Наставник')
      expect(e.target).toEqual({ day: 1, anchor: 'part-mentor' })
      // слов, которых нет на странице («пункт проверки», «вопрос наставника»), в тексте записи нет
      expect(e.text).toBe('')
    }
    expect(searchCourse('вопрос наставника', mentor)).toEqual([])
  })

  it('тема дня: цель и результат — в тексте, цель — начало дня', () => {
    const day = day1.find((e) => e.kind === 'day')
    expect(day?.label).toBe('День 1 · Тема дня')
    expect(day?.title).toBe(days[0].title)
    expect(day?.text).toContain(days[0].goal)
    expect(day?.text).toContain(days[0].result)
    expect(day?.target).toEqual({ day: 1, anchor: 'part-why' })
  })

  it('день 1 даёт записи всех десяти видов с подписью «День N · …»', () => {
    const labels: Record<CourseEntry['kind'], string> = {
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
    expect(new Set(day1.map((e) => e.kind))).toEqual(new Set(Object.keys(labels)))
    for (const e of day1) expect(e.label).toBe(`День 1 · ${labels[e.kind]}`)
  })

  it('схема, тренажёр, ситуация и помощник ИИ ведут к своему блоку, ролик — к «Теории»', () => {
    const anchors = Object.fromEntries(day1.filter((e) => ['diagram', 'trainer', 'scenario', 'ai', 'video'].includes(e.kind)).map((e) => [e.kind, e.target.anchor]))
    expect(anchors).toEqual({ diagram: 'block-restaurant-map', trainer: 'block-modes-sort', scenario: 'block-pick-model', ai: 'block-ask-day1', video: 'part-theory' })
    const diagram = day1.find((e) => e.kind === 'diagram')
    expect(diagram?.title).toBe('Путь нажатия «Сохранить подход» от телефона до базы')
    expect(day1.find((e) => e.kind === 'scenario')?.title).toBe('Выбираем модель для проекта')
  })

  it('записи идут в порядке источника: дни по порядку, внутри дня — как на странице', () => {
    expect(entries.map((e) => e.target.day)).toEqual([...entries.map((e) => e.target.day)].sort((a, b) => a - b))
    expect(day1.map((e) => e.kind)[0]).toBe('day')
    const order = day1.map((e) => e.kind)
    expect(order.indexOf('idea')).toBeLessThan(order.indexOf('quiz'))
    expect(order.indexOf('quiz')).toBeLessThan(order.indexOf('practice'))
    expect(order.indexOf('practice')).toBeLessThan(order.indexOf('mentor'))
  })

  it('у каждой записи есть название, подпись и допустимая цель; block-… — существующий блок дня', () => {
    expect(entries.length).toBeGreaterThan(40)
    for (const e of entries) {
      expect(e.title.length).toBeGreaterThan(0)
      expect(e.label).toMatch(new RegExp(`^День ${e.target.day} · `))
      expect(e.target.anchor).toMatch(/^(block-.+|part-(theory|quiz|practice|mentor|summary|why))$/)
      if (e.target.anchor.startsWith('block-')) {
        const day = days.find((d) => d.number === e.target.day)
        const ids = (day?.blocks ?? []).map((b) => ('id' in b ? b.id : ''))
        expect(ids).toContain(e.target.anchor.slice('block-'.length))
      }
    }
  })

  it('поиск по настоящим записям: «ресторан» находит мысль, метки стоят на искомом слове', () => {
    const hits = searchCourse('ресторан', entries)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].entry.title).toBe('Приложение устроено как ресторан')
    for (const h of hits) {
      for (const [a, b] of h.titleMarks) expect(fold(h.entry.title.slice(a, b))).toBe('ресторан')
      for (const [a, b] of h.snippetMarks) expect(fold(h.snippet.slice(a, b))).toBe('ресторан')
    }
  })
})

describe('courseEntries (тренажёры и схемы с разными полями)', () => {
  const day: Day = DaySchema.parse({
    id: 'day-02',
    number: 2,
    week: 1,
    status: 'draft',
    title: 'Тема',
    goal: 'Цель',
    blocks: [
      { type: 'diagram', id: 'map', figure: 'f', caption: 'Подпись схемы', hotspots: [], steps: ['Первый шаг', 'Второй шаг'] },
      { type: 'diagram', id: 'bare', figure: 'f', caption: 'Схема без шагов', hotspots: [] },
      {
        type: 'trainer',
        kind: 'prompt-builder',
        id: 'pb',
        task: 'Попросить экран входа',
        parts: [{ key: 'goal', label: 'Цель', good: ['Хорошо'], bad: ['Плохо'] }],
      },
      { type: 'trainer', kind: 'find-the-bug', id: 'bug', title: 'Утечка ключа', lines: ['const key = "sk-1"', 'send(key)'], bugLines: [0], explanation: 'Ключ в коде' },
      { type: 'ai-helper', id: 'ask', mode: 'ask', title: 'Спросите про схему', placeholder: 'Например: что такое API?', context: 'Скрытая подсказка для модели' },
    ],
  })
  const entries = courseEntries([day])
  const by = (id: string) => entries.find((e) => e.target.anchor === `block-${id}`)

  it('черновой день участвует тем, что в нём есть: тема, цель и блоки, без теста и практики', () => {
    expect(entries.map((e) => e.kind)).toEqual(['day', 'diagram', 'diagram', 'trainer', 'trainer', 'ai'])
    expect(entries[0]).toMatchObject({ label: 'День 2 · Тема дня', title: 'Тема', text: 'Цель.', target: { day: 2, anchor: 'part-why' } })
    expect(entries[1].label).toBe('День 2 · Схема')
  })

  it('ролик без id: название ролика, цель — часть «Теория»', () => {
    const [video] = courseEntries([DaySchema.parse({ id: 'day-04', number: 4, week: 1, status: 'draft', title: 'Т', goal: 'Ц', blocks: [{ type: 'video', videoId: 'v1', title: 'Название ролика' }] })]).slice(1)
    expect(video).toEqual({ kind: 'video', label: 'День 4 · Видеоурок', title: 'Название ролика', text: '', target: { day: 4, anchor: 'part-theory' } })
  })

  it('схема: подпись — в заголовке, шаги — в тексте', () => {
    expect(by('map')).toMatchObject({ kind: 'diagram', title: 'Подпись схемы', text: expect.stringContaining('Второй шаг') })
    expect(by('bare')).toMatchObject({ kind: 'diagram', title: 'Схема без шагов', text: '' })
  })

  it('тренажёры: у «Собери запрос» название — «Собери запрос», задача — в тексте; у «Найди ошибку» — название и код', () => {
    expect(by('pb')).toMatchObject({ kind: 'trainer', title: 'Собери запрос', text: expect.stringContaining('Попросить экран входа') })
    expect(by('bug')).toMatchObject({ kind: 'trainer', title: 'Утечка ключа', text: expect.stringContaining('send(key)') })
    // ответ тренажёра в поиск не попадает
    expect(by('bug')?.text).not.toContain('Ключ в коде')
  })

  it('помощник ИИ: заголовок и пример вопроса, скрытая подсказка для модели не ищется', () => {
    expect(by('ask')).toMatchObject({ kind: 'ai', title: 'Спросите про схему', text: 'Например: что такое API?' })
    expect(searchCourse('скрытая подсказка', entries)).toEqual([])
  })
})

describe('termEntries и поиск терминов', () => {
  const days = getDays()
  const terms = termEntries(glossary, days)

  it('по записи на термин словаря', () => {
    expect(terms).toHaveLength(glossary.length)
    expect(terms[0].term).toBe(glossary[0].term)
  })

  it('«Агент»: определение, bookRef — первая ссылка словаря, day — первый день с этой карточкой', () => {
    const agent = terms.find((t) => t.term === 'Агент')
    expect(agent?.definition).toBe(glossary.find((g) => g.term === 'Агент')?.definition)
    expect(agent?.bookRef).toBe(glossary.find((g) => g.term === 'Агент')?.refs[0])
    expect(agent?.day).toBe(days.find((d) => d.cards.includes('Агент'))?.number)
    expect(agent?.day).toBe(1)
  })

  it('термин вне карточек дней — без day', () => {
    expect(days.some((d) => d.cards.includes('Агент фонового программирования'))).toBe(false)
    const t = terms.find((x) => x.term === 'Агент фонового программирования')
    expect(t?.day).toBeUndefined()
    expect(t?.bookRef).toBe('ch10')
  })

  it('day — наименьший номер из дней с карточкой; без refs нет bookRef', () => {
    const mk = (number: number, cards: string[]): Day =>
      DaySchema.parse({ id: `day-${String(number).padStart(2, '0')}`, number, week: 1, status: 'draft', title: 'Т', goal: 'Ц', cards })
    const result = termEntries(
      [
        { term: 'Икс', definition: 'Определение', refs: [] },
        { term: 'Игрек', definition: 'Определение', refs: ['ch1', 'ch2'] },
      ],
      [mk(5, ['Икс', 'Игрек']), mk(3, ['Игрек'])],
    )
    expect(result[0]).toEqual({ term: 'Икс', definition: 'Определение', graphId: 'term:1', day: 5 })
    expect(result[1]).toEqual({ term: 'Игрек', definition: 'Определение', graphId: 'term:2', bookRef: 'ch1', day: 3 })
  })

  it('graphId — узел термина на графе: term:<номер в словаре с 1>', () => {
    const labels = new Map(graph.nodes.map((n) => [n.id, n.label]))
    expect(terms[0].graphId).toBe('term:1')
    for (const t of terms) expect(labels.get(t.graphId)).toBe(t.term)
  })

  it('searchTerms("rls") ставит термин про RLS первым', () => {
    const hits = searchTerms('rls', terms)
    expect(hits.length).toBeGreaterThanOrEqual(2)
    expect(hits[0].entry.term).toBe('Политики доступа к строкам (RLS)')
    expect(hits[0].titleMarks.map(([a, b]) => hits[0].entry.term.slice(a, b))).toEqual(['RLS'])
  })

  it('searchTerms("агент"): точное название выше названий, которые начинаются с запроса', () => {
    const hits = searchTerms('агент', terms)
    expect(hits[0].entry.term).toBe('Агент')
    expect(hits[1].entry.term.toLowerCase().startsWith('агент')).toBe(true)
    // запрос с заглавной и «ё»-лишним тот же
    expect(searchTerms('АГЕНТ', terms).map((h) => h.entry.term)).toEqual(hits.map((h) => h.entry.term))
  })
})

describe('searchBook', () => {
  const book: BookEntry[] = [
    { a: 's1', c: 'Глава про базу', s: '', t: 'Первый абзац про политики' },
    { a: 's2', c: 'Глава про базу', s: 'Политики доступа', t: 'Текст раздела' },
    { a: 's3', c: 'Другая глава', s: 'Другой раздел', t: 'Здесь тоже политики и политики' },
    // запись-заголовок раздела (текст = название) и абзац этого раздела
    { a: 's4', c: 'Другая глава', s: 'Политики строк', t: 'Политики строк' },
    { a: 's4', c: 'Другая глава', s: 'Политики строк', t: 'Каждая политика проверяет строку' },
  ]

  it('запись подходит только по своему тексту; заголовок раздела — лишь для порядка: заголовок, абзацы раздела, остальные по порядку книги', () => {
    const hits = searchBook('политик', book)
    // s2 совпал бы только по названию раздела — его нет
    expect(hits.map((h) => h.entry.t)).toEqual(['Политики строк', 'Каждая политика проверяет строку', 'Первый абзац про политики', 'Здесь тоже политики и политики'])
    expect(hits[0].titleMarks).toEqual([[0, 7]])
    expect(hits[1].snippetMarks).toEqual([[7, 14]])
    expect(hits[2].snippetMarks).toEqual([[17, 24]])
  })

  it('название главы или раздела без слова в тексте записи не находит', () => {
    expect(searchBook('глава про базу', book)).toEqual([])
    expect(searchBook('политики доступа', book)).toEqual([])
  })

  it('метки во фрагменте — по всем вхождениям', () => {
    const [hit] = searchBook('политики', [book[2]])
    expect(hit.snippetMarks.map(([a, b]) => hit.snippet.slice(a, b))).toEqual(['политики', 'политики'])
  })

  it('на настоящем индексе книги: «RLS» находит разделы, метки стоят на слове', () => {
    const entries: BookEntry[] = bookIndex
    const hits = searchBook('RLS', entries)
    expect(hits.length).toBeGreaterThan(3)
    for (const h of hits) {
      const title = h.entry.s || h.entry.c
      expect(fold(`${title} ${h.entry.t}`)).toContain('rls')
      for (const [a, b] of h.titleMarks) expect(fold(title.slice(a, b))).toBe('rls')
      for (const [a, b] of h.snippetMarks) expect(fold(h.snippet.slice(a, b))).toBe('rls')
      expect(h.snippet.length).toBeLessThanOrEqual(160)
    }
  })

  it('на настоящем индексе книги: каждое найденное — со словом в своём тексте (метка во фрагменте), кроме записи-заголовка', () => {
    const entries: BookEntry[] = bookIndex
    for (const q of ['Бенчмарк', 'Агент']) {
      const hits = searchBook(q, entries)
      expect(hits.length, q).toBeGreaterThan(5)
      const bare = hits.filter((h) => h.snippetMarks.length === 0 && h.entry.t !== h.entry.s)
      expect(bare.map((h) => `${h.entry.s} | ${h.entry.t.slice(0, 40)}`), q).toEqual([])
    }
  })

  it('на настоящем индексе книги: «ё» и дефис в запросе дают то же, что без них', () => {
    const entries: BookEntry[] = bookIndex
    const ids = (q: string) => searchBook(q, entries).map((h) => h.entry.a + h.entry.s + h.entry.t.length)
    // в книге только «объём» с «ё»: запрос без «ё» и с заглавными находит те же места
    expect(ids('объем').length).toBeGreaterThan(0)
    expect(ids('ОБЪЁМ')).toEqual(ids('объем'))
    expect(ids('объём')).toEqual(ids('объем'))
    expect(ids('политики доступа').length).toBeGreaterThan(0)
    expect(ids('«Политики доступа»')).toEqual(ids('политики-доступа'))
  })
})
