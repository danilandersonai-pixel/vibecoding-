import { describe, expect, it } from 'vitest'
import { buildLesson } from './build'
import { fixtureLesson } from './fixture-lesson'
import type { Lesson, LessonScene } from './lesson'
import { typedFrames } from './motion'
import { lessonProblems } from './problems'
import { MOTION } from './theme'

// Фикстура проходит все проверки урока, кроме длины (она короче ролика главы). Каждая поломка ниже — по одной — даёт свою строку.
const short = (lesson: Lesson) => lessonProblems(lesson, { checkLength: false })

function broken(change: (l: Lesson, scene: (id: string) => LessonScene) => void): string[] {
  const l = structuredClone(fixtureLesson)
  const scene = (id: string) => l.chapters.flatMap((c) => c.scenes).find((s) => s.id === id)!
  change(l, scene)
  return short(l)
}

const has = (problems: string[], re: RegExp) => expect(problems).toContainEqual(expect.stringMatching(re))

describe('lessonProblems: фикстура', () => {
  it('без проверки длины — ни одной проблемы', () => {
    expect(short(fixtureLesson)).toEqual([])
  })

  it('с проверкой длины — одна строка: ролик главы короче 5400 кадров', () => {
    const problems = lessonProblems(fixtureLesson)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/урок «term-lesson»: длина \d+ кадров.*5400–8100/)
  })

  it('minFrames — не короче прежнего ролика той же темы', () => {
    has(lessonProblems(fixtureLesson, { minFrames: 9000 }), /не короче прежнего: 9000/)
  })
})

describe('lessonProblems: поломки по одной', () => {
  it('неизвестный раздел книги у сцены', () => {
    const p = broken((_, s) => (s('parts-pkg').book = ['sa99']))
    has(p, /сцена «parts-pkg»: раздела книги «sa99» нет/)
    expect(broken((_, s) => (s('parts-pkg').book = ['sa2']))).toEqual([])
  })

  it('сцена mistake без «Верно»', () => {
    const p = broken((_, s) => (s('parts-key').verdict = [{ at: 0, kind: 'wrong' }]))
    has(p, /сцена «parts-key»: .*вердикт.*right/)
  })

  it('«Верно» раньше «Неверно»', () => {
    const p = broken((_, s) => (s('parts-key').verdict = [{ at: 0, kind: 'right' }, { at: 1, kind: 'wrong' }]))
    has(p, /сцена «parts-key»: .*wrong.*раньше/)
  })

  // Серия сцен mistake подряд в главе (например, «Неверно» на доске, «Верно» — в редакторе и терминале): вердикты — на всю серию
  const series = (first: LessonScene['verdict'], second: LessonScene['verdict'], third?: LessonScene['verdict']) =>
    broken((l, s) => {
      const key = s('parts-key')
      key.verdict = first
      const extra = [second, ...(third === undefined ? [] : [third])].map((v, i): LessonScene => ({ ...structuredClone(key), id: `parts-key-${i + 2}`, verdict: v }))
      l.chapters[1].scenes.push(...extra)
    })

  it('серия сцен mistake: «Неверно» в первой, «Верно» во второй, третья без вердиктов — без проблем', () => {
    expect(series([{ at: 0, kind: 'wrong' }], [{ at: 0, kind: 'right' }], [])).toEqual([])
    expect(series([{ at: 0, kind: 'wrong' }], [{ at: 0, kind: 'right' }], undefined)).toEqual([])
  })

  it('серия сцен mistake: «Верно» раньше «Неверно» или одного из них нет на всю серию', () => {
    has(series([{ at: 0, kind: 'right' }], [{ at: 0, kind: 'wrong' }]), /сцена «parts-key»: .*wrong.*раньше.*parts-key-2/)
    has(series([{ at: 0, kind: 'wrong' }], []), /сцена «parts-key»: .*вердикт.*right.*parts-key-2/)
    has(series([], []), /сцена «parts-key»: .*вердикт wrong/)
  })

  it('вердикт вне сцены mistake', () => {
    const p = broken((_, s) => (s('site-dev').verdict = [{ at: 0, kind: 'wrong' }]))
    has(p, /сцена «site-dev»: вердикты бывают только у сцены mistake/)
  })

  it('пояснение в последних 12 кадрах сцены (until — до самого конца)', () => {
    const p = broken((_, s) => (s('site-dev').spots![0].until = 2))
    has(p, /сцена «site-dev»: spots\[0\].*последние 12 кадров/)
  })

  it('пояснение в первых 12 кадрах сцены (реплика 0 начинается на кадре 9)', () => {
    const p = broken((_, s) => (s('site-dev').spots![0].at = 0))
    has(p, /сцена «site-dev»: spots\[0\].*первые 12 кадров/)
  })

  it('реплика 200 знаков — три строки субтитров', () => {
    const p = broken((_, s) => (s('site-envs').lines[1] = 'Разработка — ваш компьютер, здесь можно ломать что угодно; staging — копия боевой версии, где всё проверяют перед выпуском; продакшен — настоящее приложение, ошибка стоит дорого.'))
    has(p, /сцена «site-envs»: реплика 1 .*3 строки субтитров/)
  })

  it('камера движется во время пояснения', () => {
    const p = broken((_, s) => s('parts-route').camera!.push({ at: 2, target: 'whole' }))
    has(p, /сцена «parts-route»: spots\[0\].*камера движется/)
  })

  it('цель камеры — несуществующая часть cmd:nope', () => {
    const p = broken((_, s) => (s('site-dev').camera = [{ at: 0, target: 'cmd:nope' }]))
    has(p, /сцена «site-dev»: camera\[0\]: части «cmd:nope» нет в кадре terminal/)
  })

  it('цель пояснения — несуществующая часть', () => {
    const p = broken((_, s) => (s('site-dev').spots![0].target = 'line:dev:99'))
    has(p, /сцена «site-dev»: spots\[0\]: части «line:dev:99» нет в кадре terminal/)
  })

  it('пояснение за краем кадра 1920 × 1080 после наезда камеры', () => {
    const p = broken((_, s) => (s('parts-route').spots![0].target = 'tree'))
    has(p, /сцена «parts-route»: spots\[0\].*за краем кадра/)
  })

  it('пояснение под шапкой: после наезда камеры выше y 88 (видимая часть кадра — от шапки)', () => {
    const l = structuredClone(fixtureLesson)
    l.chapters[1].scenes.find((s) => s.id === 'parts-route')!.spots![0].target = 'line:20'
    const spot = buildLesson(l).script.hotspots.find((h) => h.title === 'Ответ 400')!
    expect(spot.y).toBeGreaterThan(0)
    expect(spot.y).toBeLessThan(88)
    has(short(l), /сцена «parts-route»: spots\[0\]: «line:20» после камеры за краем кадра/)
  })

  it('реплики, которой нет в сцене, у камеры, пояснения и вердикта', () => {
    has(broken((_, s) => (s('site-dev').camera = [{ at: 5, target: 'whole' }])), /сцена «site-dev»: camera\[0\]: реплики 5 нет в сцене — в ней 2/)
    has(broken((_, s) => (s('site-dev').spots![0].at = 2)), /сцена «site-dev»: spots\[0\]: реплики 2 нет в сцене/)
    has(broken((_, s) => (s('parts-key').verdict![1].at = 3)), /сцена «parts-key»: verdict\[1\]: реплики 3 нет в сцене/)
  })

  it('глава без сцены example', () => {
    const p = broken((l) => (l.chapters[2].scenes = l.chapters[2].scenes.filter((s) => s.role !== 'example')))
    has(p, /глава «site»: нет сцены с ролью example/)
  })

  it('роли в главе не по порядку explain → example → mistake', () => {
    const p = broken((l) => l.chapters[1].scenes.reverse())
    has(p, /глава «parts»: .*не по порядку/)
  })

  it('промежуток 5 с без изменений в кадре', () => {
    const p = broken((_, s) => {
      const envs = s('site-envs')
      envs.frame = { type: 'board', cards: [{ title: 'Три окружения', text: ['разработка, staging и продакшен'], at: 0 }] }
      envs.lines = ['Разработка — ваш компьютер, здесь можно ломать что угодно.', 'Продакшен — настоящее приложение, ошибка там стоит дорого.']
    })
    has(p, /сцена «site-envs»: кадр стоит без изменений \d+ кадров/)
  })

  it('ключ камеры, который ничего не меняет (whole при целом кадре), не закрывает стоящий кадр', () => {
    const p = broken((_, s) => {
      const envs = s('site-envs')
      envs.frame = { type: 'board', cards: [{ title: 'Три окружения', text: ['разработка, staging и продакшен'], at: 0 }] }
      envs.lines = ['У проекта обычно три окружения.', 'Разработка, staging, продакшен.']
      envs.camera = [{ at: 1, target: 'whole' }]
    })
    has(p, /сцена «site-envs»: кадр стоит без изменений \d+ кадров/)
  })

  it('раздел книги s999', () => {
    const p = broken((l) => (l.chapters[1].book = ['s999']))
    has(p, /глава «parts»: раздела книги «s999» нет/)
    has(broken((l) => (l.book = ['sa1', 's999'])), /урок «term-lesson»: раздела книги «s999» нет/)
  })

  it('проблемы кадра — с именем сцены', () => {
    const p = broken((_, s) => (s('site-dev').frame = { type: 'terminal', items: [{ session: 's02-sets', event: 'нет', at: 0 }] }))
    has(p, /сцена «site-dev»: items\[0\] «нет»: нет события/)
  })

  it('пояснений меньше двух у ролика главы', () => {
    const p = broken((_, s) => {
      delete s('site-dev').spots
      delete s('works-script').spots
    })
    has(p, /урок «term-lesson»: пояснений 1, а у ролика главы нужно не меньше 2/)
  })

  it('пояснения с неверным at или until не считаются в минимум: на экране их не будет', () => {
    const p = broken((_, s) => {
      const bad = { target: 'cmd:dev', title: 'Пустое', text: 'Такое пояснение не откроется.' }
      s('works-script').spots = [{ ...bad, at: 99 }]
      s('site-dev').spots = [
        { ...bad, at: 1, until: 1 }, // until не после at
        { ...bad, at: 1, until: 99 }, // until дальше конца сцены
      ]
    })
    // пояснение из первой сцены с пояснением — единственное настоящее; три неверных с ним не складываются
    has(p, /урок «term-lesson»: пояснений 1, а у ролика главы нужно не меньше 2/)
    // сами они названы своими проблемами
    has(p, /сцена «works-script»: spots\[0\]/)
    has(p, /сцена «site-dev»: spots\[0\]: until 1/)
  })

  it('каркас: первая глава — одна сцена intro с agenda, последняя — одна сцена summary с recap', () => {
    has(broken((l) => (l.chapters[0].scenes[0].frame = { type: 'board', title: 'План' })), /глава «intro»: .*agenda/)
    has(broken((l) => l.chapters[4].scenes.push({ ...l.chapters[4].scenes[0], id: 'recap-2' })), /глава «recap»: .*одна сцена/)
  })

  it('ролик главы: тематических глав 3–5', () => {
    const p = broken((l) => l.chapters.splice(3, 1))
    has(p, /урок «term-lesson»: тематических глав 2, а у ролика главы их 3–5/)
  })

  it('кадр записи — не меньше чем в трёх тематических главах', () => {
    const p = broken((_, s) => {
      s('parts-route').frame = { type: 'board', title: 'Кухня', cards: [{ title: 'route.ts', text: ['проверяет вес'], at: 0 }, { title: '400', text: ['ответ'], at: 1 }, { title: 'Ошибка', text: ['текст'], at: 2 }] }
      s('parts-pkg').frame = { type: 'board', title: 'Чужие детали', cards: [{ title: 'next', text: ['фреймворк'], at: 0 }, { title: 'react', text: ['интерфейс'], at: 1 }] }
    })
    has(p, /урок «term-lesson»: кадр записи .* в 2 тематических главах/)
  })

  it('ролик дня: главы «Что строим сегодня» → «Пример» → «Подводный камень» → «Проверьте у себя»', () => {
    const p = broken((l) => {
      l.kind = 'day'
      l.chapters = [l.chapters[0], l.chapters[2], l.chapters[4]]
    })
    has(p, /урок «term-lesson»: у ролика дня 4 главы/)
    const titles = broken((l) => {
      l.kind = 'day'
      l.chapters = [l.chapters[0], { ...l.chapters[2], scenes: [l.chapters[2].scenes[1]] }, { ...l.chapters[3], scenes: [l.chapters[3].scenes[2]] }, l.chapters[4]]
    })
    has(titles, /глава «intro»: у ролика дня глава 1 — «Что строим сегодня»/)
    has(titles, /глава «site»: у ролика дня глава 2 — «Пример»/)
  })

  it('id сцены повторяется', () => {
    const p = broken((_, s) => (s('site-local').id = 'site-dev'))
    has(p, /сцена «site-dev»: id сцены повторяется/)
  })
})

describe('lessonProblems: шапка, шум песочницы, прокрутка терминала', () => {
  it('название главы не помещается в шапку рядом со ссылкой на книгу', () => {
    const p = broken((l) => (l.chapters[2].title = 'Как код с компьютера разработчика попадает на настоящий сайт для людей'))
    has(p, /сцена «site-envs»: название главы .* не помещается в шапку рядом со ссылкой на книгу/)
  })

  it('в сцене mistake название главы не должно доходить до метки «Типичная ошибка»', () => {
    // У «term-lesson» 53 знака: рядом со ссылкой на книгу помещается (ей остаётся 25), рядом с метками ошибки — нет (там 51)
    const title = 'Четыре части: зал, официант, кухня и склад приложения'
    expect([...title].length).toBe(53)
    const p = broken((l) => (l.chapters[1].title = title))
    has(p, /сцена «parts-key»: название главы .* налезает на метку «Типичная ошибка»/)
    expect(p).toHaveLength(1)
  })

  it('шум песочницы в кадре: предупреждения о Google Fonts в выводе dev-сервера', () => {
    const p = broken((_, s) => (s('site-dev').frame = { type: 'terminal', items: [{ session: 's02-sets', event: 'dev', at: 0 }, { session: 's02-sets', event: 'save-ok', at: 1, lines: [24, 29] }] }))
    has(p, /сцена «site-dev»: в кадре шум песочницы .*Google Fonts/)
  })

  it('терминал прокручивается, а камера наведена на строку раннего элемента', () => {
    const p = broken((_, s) => {
      const dev = s('site-dev')
      dev.frame = {
        type: 'terminal',
        items: [
          { session: 's02-sets', event: 'dev', at: 0 },
          { session: 's02-sets', event: 'start-dev', at: 0 },
          { session: 's02-sets', event: 'scripts', at: 1 },
        ],
      }
      delete dev.spots
      dev.camera = [{ at: 1, target: 'line:start-dev:0' }]
    })
    has(p, /сцена «site-dev»: camera\[0\]: терминал прокручивается — цель камеры «line:start-dev:0» к концу сцены на другом месте; разделите сцену/)
  })
})

describe('lessonProblems: прокрутка последнего элемента терминала', () => {
  it('пояснение на строке последнего элемента, которую его же вывод уводит вверх', () => {
    const p = broken((_, s) => {
      const dev = s('site-dev')
      dev.frame = {
        type: 'terminal',
        items: [
          { session: 's02-sets', event: 'dev', at: 0 },
          { session: 's02-sets', event: 'scripts', at: 1 },
        ],
      }
      dev.spots = [{ at: 1, target: 'line:scripts:0', title: 'npm run', text: 'Список скриптов проекта.' }]
    })
    has(p, /сцена «site-dev»: spots\[0\]: терминал прокручивается — цель пояснения «line:scripts:0» к концу сцены на другом месте; разделите сцену/)
  })

  it('последняя строка, которая появляется уже при конечной прокрутке, — можно', () => {
    const p = broken((_, s) => {
      const dev = s('site-dev')
      dev.frame = {
        type: 'terminal',
        items: [
          { session: 's02-sets', event: 'dev', at: 0 },
          { session: 's02-sets', event: 'scripts', at: 1 },
        ],
      }
      dev.spots = [{ at: 1, target: 'line:scripts:9', title: 'eslint', text: 'Последняя строка списка.' }]
    })
    expect(p.filter((x) => x.includes('прокручивается'))).toEqual([])
  })
})

// Пояснение открывается на паузе там, где часть кадра уже видна: у терминала строка вывода появляется через 17–20 кадров после реплики
// (команда набирается 30 знаков/с, первая строка — через MOTION.stagger), у агента шаги ждут конца набора запроса.
describe('lessonProblems: пояснение не раньше своей цели', () => {
  const S2 = 's02-sets'
  const devWith = (second: { event: string; lines?: [number, number] }, spot: { target: string; title: string }) =>
    broken((_, s) => {
      const dev = s('site-dev')
      dev.frame = { type: 'terminal', items: [{ session: S2, event: 'dev', at: 0 }, { session: S2, at: 1, ...second }] }
      dev.spots = [{ at: 1, text: 'Что здесь видно.', ...spot }]
    })

  it('пояснение раньше появления строки вывода — проблема с кадрами', () => {
    const p = devWith({ event: 'diff' }, { target: 'line:diff:0', title: 'Дифф' })
    // `git diff --stat` начинает набираться на реплике 1 (вывод dev кончился раньше), первая строка — после набора и шага очереди
    const l = structuredClone(fixtureLesson)
    const from = buildLesson(l).scenes.find((b) => b.id === 'site-dev')!.clock.beat(1)
    const line = from + typedFrames('git diff --stat') + MOTION.stagger
    expect(line - from).toBe(17)
    has(p, new RegExp(`^сцена «site-dev»: spots\\[0\\]: Пояснение «Дифф» открывается на кадре ${from}, а «line:diff:0» появляется на кадре ${line}`))
    expect(p).toHaveLength(1)
    // команда — тоже цель с набором: видна целиком, когда набрана
    has(devWith({ event: 'diff' }, { target: 'cmd:diff', title: 'Дифф' }), new RegExp(`Пояснение «Дифф» открывается на кадре ${from}, а «cmd:diff» появляется на кадре ${from + 15}`))
    // вывод — с первой строки
    has(devWith({ event: 'diff' }, { target: 'out:diff', title: 'Дифф' }), new RegExp(`а «out:diff» появляется на кадре ${line}`))
  })

  it('пояснение после появления — без проблем', () => {
    // строка раннего элемента появилась задолго до реплики пояснения
    expect(devWith({ event: 'diff' }, { target: 'line:dev:7', title: 'Ready' })).toEqual([])
    // строка server у события browser идёт без набора, с самой реплики: пояснение на той же реплике открывается вместе с ней
    expect(devWith({ event: 'save-ok', lines: [47, 47] }, { target: 'line:save-ok:0', title: 'Запрос' })).toEqual([])
    // фикстура: пояснения на cmd:dev и line:start-dev:0 — после появления своих целей
    expect(short(fixtureLesson)).toEqual([])
  })
})

describe('buildLesson на сломанном уроке не падает внутри lessonProblems', () => {
  it('реплики нет — проверка говорит об этом, а не бросает исключение', () => {
    const l = structuredClone(fixtureLesson)
    l.chapters[2].scenes[1].lines = []
    expect(() => short(l)).not.toThrow()
    has(short(l), /сцена «site-dev»: нет реплик/)
    expect(() => buildLesson(fixtureLesson)).not.toThrow()
  })
})
