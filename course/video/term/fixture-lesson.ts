import envs from '../../content/figures/abc_envs.svg?raw'
import restaurant from '../../content/figures/abc_restaurant.svg?raw'
import s01 from '../sessions/s01-start.json'
import s02 from '../sessions/s02-sets.json'
import type { SessionRecord } from '../sessions/types'
import type { Lesson } from './lesson'

// Фикстура урока для тестов сборки и проверок и для композиции term-lesson (кадры глазами): короткий ролик главы
// по каркасу — «Что узнаете», три тематические главы (объяснение → пример → ошибка), «Итог» — на настоящих записях
// s01-start и s02-sets и схемах книги, с камерой, пояснениями и вердиктами. Он короче ролика главы: тесты проверяют его
// с checkLength: false. Факты — из разделов книги sa1, sa2, sa4, sa5.

const S2 = 's02-sets'

export const fixtureLesson: Lesson = {
  id: 'term-lesson',
  kind: 'chapter',
  title: 'Приложение тренера изнутри',
  book: ['sa1', 'sa4', 'sa5'],
  sessions: [s01, s02] as SessionRecord[],
  chapters: [
    {
      id: 'intro',
      title: 'Что узнаете',
      scenes: [
        {
          id: 'agenda',
          role: 'intro',
          frame: { type: 'agenda', at: [0, 1, 2] },
          lines: ['Сначала — из каких частей состоит приложение.', 'Потом — как код попадает на сайт.', 'И как понять, что всё работает.'],
        },
      ],
    },
    {
      id: 'parts',
      title: 'Четыре части приложения',
      book: ['sa1', 'sa2'],
      scenes: [
        {
          id: 'parts-scheme',
          role: 'explain',
          frame: { type: 'figure', svg: restaurant, reveal: { from: 0, to: 1 }, focus: [{ at: 2, name: 'Бэкенд', rect: [457.6, 76, 139.2, 114] }] },
          lines: ['Приложение устроено как ресторан.', 'Зал, официант, кухня и склад.', 'Кухня — это бэкенд, он на сервере.'],
          camera: [{ at: 2, target: 'focus:Бэкенд' }],
        },
        {
          id: 'parts-route',
          role: 'example',
          frame: { type: 'editor', session: S2, event: 'route', tree: { session: S2, commit: 'c-form' }, lines: [19, 31], highlight: [{ at: 1, lines: [27, 28] }, { at: 2, lines: [29, 29] }] },
          lines: ['Кухня приложения тренера — route.ts.', 'Здесь сервер проверяет вес.', 'Не число — ответ с кодом 400.'],
          camera: [{ at: 1, target: 'line:29' }],
          spots: [{ at: 2, target: 'line:29', title: 'Ответ 400', text: 'Вес не число: сервер не сохраняет подход и отвечает кодом 400 с текстом ошибки.' }],
        },
        {
          id: 'parts-pkg',
          role: 'example',
          frame: { type: 'editor', session: 's01-start', event: 'pkg', lines: [1, 18], highlight: [{ at: 1, lines: [11, 15] }] },
          lines: ['Чужие детали записаны в package.json.', 'Это зависимости: next и react.'],
        },
        {
          id: 'parts-key',
          role: 'mistake',
          frame: {
            type: 'board',
            cards: [
              { title: 'Ключ в чате', text: ['его видно в переписке, он может уйти в код'], at: 0, tone: 'err' },
              { title: 'Ключ в .env.local', text: ['файл в .gitignore — git его не видит'], at: 1, tone: 'ok' },
            ],
          },
          lines: ['Ошибка — вставить ключ прямо в чат.', 'Верно — положить его в .env.local.'],
          verdict: [
            { at: 0, kind: 'wrong' },
            { at: 1, kind: 'right' },
          ],
        },
      ],
    },
    {
      id: 'site',
      title: 'От компьютера к сайту',
      book: ['sa4'],
      scenes: [
        {
          id: 'site-envs',
          role: 'explain',
          frame: { type: 'figure', svg: envs, reveal: { from: 0, to: 1 } },
          lines: ['У проекта обычно три окружения.', 'Разработка, staging и продакшен.'],
        },
        {
          id: 'site-dev',
          role: 'example',
          frame: {
            type: 'terminal',
            items: [
              { session: S2, event: 'dev', at: 0 },
              { session: S2, event: 'save-ok', at: 1, lines: [47, 47] },
            ],
          },
          lines: ['Запускаем сайт у себя: npm run dev.', 'Открыли localhost — пришёл запрос.'],
          spots: [{ at: 1, target: 'cmd:dev', title: 'npm run dev', text: 'Запускает сайт на вашем компьютере: адрес localhost видите только вы.' }],
        },
        {
          id: 'site-local',
          role: 'mistake',
          frame: {
            type: 'board',
            cards: [
              { title: 'Только у себя', text: ['на localhost работает, у людей — нет'], at: 0, tone: 'err' },
              { title: 'Сначала staging', text: ['копия боевой версии, потом продакшен'], at: 1, tone: 'ok' },
            ],
          },
          lines: ['Ошибка — проверить только у себя.', 'Верно — сначала staging.'],
          verdict: [
            { at: 0, kind: 'wrong' },
            { at: 1, kind: 'right' },
          ],
        },
      ],
    },
    {
      id: 'works',
      title: 'Как понять, что работает',
      book: ['sa5'],
      scenes: [
        {
          id: 'works-words',
          role: 'explain',
          frame: {
            type: 'board',
            title: 'Слова системы, которая ловит ошибки',
            table: {
              head: ['Слово', 'Что значит'],
              rows: [
                ['Баг', 'ошибка в программе'],
                ['Тест', 'автоматическая проверка'],
                ['Лог', 'запись о том, что делала программа'],
              ],
              at: [0, 1, 2],
            },
          },
          lines: ['Баг — ошибка в программе.', 'Тест — автоматическая проверка.', 'Лог — запись о том, что было.'],
        },
        {
          id: 'works-console',
          role: 'example',
          frame: { type: 'browser', session: S2, event: 'save-bad', console: true, consoleLines: [5, 5], at: { page: 0, console: 2 } },
          lines: ['Открываем страницу тренера.', 'Вводим вес «60 кг» и сохраняем.', 'На странице тихо, а в Console — 400.'],
          camera: [
            { at: 1, target: 'field:Вес, кг' },
            { at: 2, target: 'whole' },
          ],
        },
        {
          id: 'works-script',
          role: 'mistake',
          frame: {
            type: 'terminal',
            items: [
              { session: S2, event: 'start-dev', at: 0 },
              { session: S2, event: 'scripts', at: 1 },
            ],
          },
          lines: ['Ошибка — верить выдуманной команде.', 'Верно — посмотреть список: npm run.'],
          spots: [{ at: 1, target: 'line:start-dev:0', title: 'Missing script', text: 'npm говорит прямо: такого скрипта в package.json нет. Список скриптов покажет npm run.' }],
          verdict: [
            { at: 0, kind: 'wrong' },
            { at: 1, kind: 'right' },
          ],
        },
      ],
    },
    {
      id: 'recap',
      title: 'Итог',
      scenes: [
        {
          id: 'recap',
          role: 'summary',
          frame: {
            type: 'recap',
            items: [
              { text: 'У приложения четыре части: зал, официант, кухня и склад.', at: 0 },
              { text: 'Сайт сначала запускают у себя, потом проверяют на staging.', at: 1 },
              { text: 'Ошибку из Console копируют целиком и отправляют ИИ.', at: 2 },
            ],
          },
          lines: ['Четыре части приложения.', 'Сначала у себя, потом staging.', 'И текст ошибки — целиком.'],
        },
      ],
    },
  ],
}
