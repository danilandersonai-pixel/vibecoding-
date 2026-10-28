import aiwords from '../../../content/figures/abc_aiwords.svg?raw'
import envs from '../../../content/figures/abc_envs.svg?raw'
import git from '../../../content/figures/abc_git.svg?raw'
import restaurant from '../../../content/figures/abc_restaurant.svg?raw'
import type { Lesson } from '../../term/lesson'

// Ролик главы «Азбука» — «Как устроено приложение» (книга sa1–sa6), набор «Репозиторий».
// Каркас: «Что узнаете» → пять тематических глав (объяснение → пример на приложении тренера → типичная ошибка) → «Итог».
// Примеры — настоящие записи s01-start (заготовка, первые коммиты) и s02-sets (форма «Сохранить подход»);
// объяснения — схемы книги. Факты и термины сверены с разделами sa1–sa6 (по главам — в комментариях у сцен).

const S1 = 's01-start'
const S2 = 's02-sets'

export const chAbc: Lesson = {
  id: 'ch-abc',
  kind: 'chapter',
  title: 'Как устроено приложение',
  book: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6'],
  chapters: [
    {
      id: 'intro',
      title: 'Что узнаете',
      scenes: [
        {
          id: 'agenda',
          role: 'intro',
          frame: { type: 'agenda', at: [0, 1, 2, 3, 4] },
          lines: ['Из чего состоит приложение.', 'Как Git хранит историю.', 'Как код попадает на сайт.', 'Как понять, что всё работает.', 'И слова про ИИ.'],
        },
      ],
    },
    {
      // sa1: фронтенд, бэкенд, сервер, база данных, API; sa2: код, проект, библиотеки, зависимости, фреймворки, ключи API в .env
      id: 'parts',
      title: 'Четыре части приложения',
      book: ['sa1', 'sa2'],
      scenes: [
        {
          id: 'parts-restaurant',
          role: 'explain',
          frame: {
            type: 'figure',
            svg: restaurant,
            reveal: { from: 0, to: 1 },
            focus: [
              { at: 1, name: 'Фронтенд', rect: [163.2, 76, 139.2, 232] },
              { at: 2, name: 'API', rect: [310.4, 76, 139.2, 232] },
              { at: 3, name: 'Бэкенд', rect: [457.6, 76, 139.2, 232] },
              { at: 4, name: 'База данных', rect: [604.8, 76, 139.2, 232] },
            ],
          },
          lines: [
            'Почти любое приложение — как ресторан.',
            'Зал — фронтенд: всё, что видно и нажимается.',
            'Официант — API: правила общения частей.',
            'Кухня — бэкенд: логика на сервере.',
            'Склад — база данных, хранилище.',
          ],
        },
        {
          id: 'parts-page',
          role: 'example',
          book: ['sa2'],
          frame: { type: 'editor', session: S2, event: 'page', tree: { session: S2, commit: 'c-form' }, lines: [48, 63], highlight: [{ at: 1, lines: [49, 56] }, { at: 2, lines: [58, 60] }] },
          lines: ['В редакторе — все файлы: это проект.', 'Фронтенд — page.tsx: поле «Повторы»…', '…и кнопка «Сохранить подход».'],
        },
        {
          id: 'parts-route',
          role: 'example',
          book: ['sa2'],
          frame: {
            type: 'editor',
            session: S2,
            event: 'route',
            tree: { session: S2, commit: 'c-form' },
            lines: [18, 30],
            highlight: [
              { at: 1, lines: [18, 19] },
              { at: 2, lines: [27, 28] },
              { at: 3, lines: [29, 29] },
            ],
          },
          lines: ['Официант и кухня — файл route.ts.', 'По адресу /api/sets приходит подход.', 'Кухня проверяет: вес — число?', 'Нет — ответ с кодом 400.'],
          spots: [{ at: 3, target: 'line:29', title: 'Ответ 400', text: '400 — код ответа «в запросе что-то не так». Сервер не сохраняет подход и объясняет почему: «Вес должен быть числом, например 60».' }],
        },
        {
          id: 'parts-pkg',
          role: 'example',
          book: ['sa2'],
          frame: { type: 'editor', session: S1, event: 'pkg', tree: { session: S2, commit: 'c-form' }, lines: [1, 16], highlight: [{ at: 1, lines: [11, 11] }, { at: 2, lines: [12, 13] }] },
          lines: ['Список чужих деталей — в package.json.', 'Без зависимостей проект не работает.', 'Next.js и React — каркас сайта.'],
          spots: [{ at: 2, target: 'line:12', title: 'Фреймворк', text: 'next и react — это Next.js и React, фреймворки: готовая заготовка приложения со своими правилами, куда встраивают своё.' }],
        },
        // Ошибка с ключом — серия из трёх сцен: «Неверно» на доске (книга sa2), «Верно» — файл .env.local в редакторе и проверка в терминале
        {
          id: 'parts-key',
          role: 'mistake',
          book: ['sa2'],
          frame: {
            type: 'board',
            title: 'Ключ API — как пин-код от карты',
            cards: [{ title: 'Ключ в чате', text: ['Никогда не вставляйте ключи в чат с ИИ.', 'И не публикуйте их на GitHub.'], at: 0, tone: 'err' }],
          },
          lines: ['Ошибка — вставить ключ API в чат.'],
          verdict: [{ at: 0, kind: 'wrong' }],
        },
        {
          id: 'parts-env',
          role: 'mistake',
          book: ['sa2'],
          frame: { type: 'editor', session: S2, event: 'env', tree: { session: S2, commit: 'c-form' }, typing: { at: 0 } },
          lines: ['Верно — ключ хранят в .env.local.'],
          verdict: [{ at: 0, kind: 'right' }],
        },
        {
          id: 'parts-ignored',
          role: 'mistake',
          book: ['sa2'],
          frame: {
            type: 'terminal',
            items: [
              { session: S2, event: 'ignored', at: 0 },
              { session: S2, event: 'status-env', at: 1 },
            ],
          },
          lines: ['Git этот файл не хранит: он в .gitignore.', 'Значит, на GitHub ключ не попадёт.'],
          camera: [{ at: 0, target: 'cmd:ignored' }],
          spots: [{ at: 1, target: 'line:ignored:0', title: '.gitignore', text: 'Список того, что Git не сохраняет. Правило .env* в строке 34 прячет все файлы, чьё имя начинается с .env.' }],
          verdict: [{ at: 0, kind: 'right' }],
        },
      ],
    },
    {
      // sa3: Git, репозиторий, коммит, ветка, дифф, GitHub, пул-реквест; совет — коммит перед крупной правкой
      id: 'git',
      title: 'Git: история проекта',
      book: ['sa3'],
      scenes: [
        {
          id: 'git-saves',
          role: 'explain',
          frame: {
            type: 'figure',
            svg: git,
            crop: [12, 66, 736, 250],
            reveal: { from: 0, to: 0 },
            focus: [
              { at: 1, name: 'Коммиты', rect: [40, 162, 620, 66] },
              { at: 2, name: 'Ветка', rect: [24, 70, 458, 76] },
              { at: 3, name: 'Пул-реквест', rect: [440, 100, 300, 52] },
              { at: 4, name: 'Откат', rect: [300, 228, 330, 88] },
            ],
          },
          lines: [
            'Git помнит всю историю проекта.',
            'Как сохранения в игре: точка — коммит.',
            'Ветка — копия для безопасных опытов.',
            'Пул-реквест — просьба влить ветку.',
            'Не вышло — откат к сохранению.',
          ],
        },
        {
          id: 'git-first',
          role: 'example',
          frame: {
            type: 'terminal',
            items: [
              { session: S1, event: 'init', at: 1 },
              { session: S1, event: 'status', at: 2 },
              { session: S1, event: 'c-start', at: 3, lines: [1, 2] },
            ],
          },
          lines: ['Терминал — окно для команд текстом.', 'git init: папка становится репозиторием.', 'git status: Git за ними не следит.', 'Коммит — сохранение с подписью.'],
          spots: [{ at: 2, until: 3, target: 'line:status:0', title: '??', text: 'Так git status отмечает новый файл: Git за ним ещё не следит. После коммита файл попадёт в историю.' }],
        },
        {
          id: 'git-log',
          role: 'example',
          frame: {
            type: 'gitlog',
            rows: [
              { session: S1, event: 'c-start', at: 0 },
              { session: S1, event: 'c-idea', at: 0 },
              { session: S1, event: 'c-claude', at: 0 },
              { session: S2, event: 'c-form', at: 1 },
            ],
            heads: [
              { at: 0, branch: 'main', commit: 'c-claude' },
              { at: 1, branch: 'sets-form', commit: 'c-form' },
              { at: 2, branch: 'main', commit: 'c-form' },
            ],
          },
          lines: ['В основной ветке main — три коммита.', 'Форма — коммит в ветке sets-form.', 'git merge вливает ветку в main.'],
        },
        {
          id: 'git-restore',
          role: 'mistake',
          frame: {
            type: 'terminal',
            items: [
              { session: S2, event: 'diff-css', at: 1 },
              { session: S2, event: 'restore', at: 2 },
              { session: S2, event: 'clean', at: 3 },
            ],
          },
          lines: ['Ошибка — крупная правка без коммита.', 'Дифф: ИИ переписал 48 строк стилей.', 'Верно — с коммитом её отменит git restore.', 'Пустой status — всё как в коммите.'],
          camera: [{ at: 0, target: 'out:diff-css' }],
          spots: [{ at: 1, until: 2, target: 'line:diff-css:0', title: 'Дифф', text: 'Разница с последним коммитом. ИИ переписал стили: в app/globals.css 36 строк добавлено и 12 убрано, всего 48. В редакторе убранное красное, новое — зелёное.' }],
          verdict: [
            { at: 0, kind: 'wrong' },
            { at: 2, kind: 'right' },
          ],
        },
      ],
    },
    {
      // sa4: локально, localhost, сборка, деплой, хостинг, домен, окружения: разработка, staging, продакшен
      id: 'site',
      title: 'От компьютера к сайту',
      book: ['sa4'],
      scenes: [
        {
          id: 'site-envs',
          role: 'explain',
          frame: {
            type: 'figure',
            svg: envs,
            reveal: { from: 0, to: 0 },
            focus: [
              { at: 1, name: 'Разработка', rect: [16, 56, 197.3, 158] },
              { at: 2, name: 'Staging', rect: [281.3, 56, 197.3, 158] },
              { at: 3, name: 'Продакшен', rect: [546.7, 56, 197.3, 158] },
            ],
          },
          lines: ['Окружений обычно три.', 'Разработка — ваш компьютер.', 'Staging — копия, где всё проверяют.', 'Продакшен — для живых людей.'],
        },
        {
          id: 'site-dev',
          role: 'example',
          frame: {
            type: 'terminal',
            items: [
              { session: S2, event: 'dev', at: 1 },
              { session: S2, event: 'save-ok', at: 2, lines: [47, 47] },
            ],
          },
          lines: ['Сайт сначала запускают у себя.', 'npm run dev — сайт работает на localhost.', 'Открыли — dev-сервер записал запрос.'],
          camera: [{ at: 0, target: 'out:dev' }],
          spots: [{ at: 1, target: 'line:dev:5', title: 'localhost', text: '«Этот компьютер»: сайт по этому адресу открывается только у вас. Остальные его не видят.' }],
        },
        {
          id: 'site-local',
          role: 'mistake',
          frame: {
            type: 'board',
            title: 'Где проверить перед выпуском',
            cards: [
              { title: 'Только у себя', text: ['На localhost всё работает.', 'И сразу — в продакшен, к людям.'], at: 0, tone: 'err' },
              { title: 'Сначала staging', text: ['Проверка на копии боевой версии.', 'Потом деплой: выложить в интернет.'], at: 1, tone: 'ok' },
            ],
            scale: {
              left: 'ошибка дешёвая',
              right: 'ошибка дорогая',
              items: [
                { label: 'Разработка', pos: 0, at: 0, side: 'above' },
                { label: 'Продакшен', pos: 1, at: 0, side: 'above' },
                { label: 'Staging', pos: 0.5, at: 1, side: 'above' },
              ],
              marker: [
                { at: 0, pos: 1 },
                { at: 1, pos: 0.5 },
              ],
              markerLabel: 'здесь нашли ошибку',
            },
          },
          lines: ['Ошибка — проверить только у себя.', 'Верно — staging, потом деплой.'],
          verdict: [
            { at: 0, kind: 'wrong' },
            { at: 1, kind: 'right' },
          ],
        },
      ],
    },
    {
      // sa5: баг, тест, панель разработчика и Console; три правила: копировать ошибку целиком, что ожидали и что получили, не править вслепую
      id: 'works',
      title: 'Как понять, что работает',
      book: ['sa5'],
      scenes: [
        {
          id: 'works-words',
          role: 'explain',
          frame: {
            type: 'board',
            title: 'Как ловят ошибки',
            table: {
              head: ['Слово', 'Что значит'],
              rows: [
                ['Баг', 'ошибка в программе: кнопка не нажимается'],
                ['Тест', 'автоматическая проверка результата'],
                ['Панель разработчика', 'F12 или Ctrl+Shift+I (на Mac — Cmd+Option+I), ошибки — во вкладке Console'],
              ],
              at: [0, 1, 2],
            },
          },
          lines: ['Баг — ошибка в программе.', 'Тест — автоматическая проверка.', 'F12 открывает панель разработчика.'],
        },
        {
          id: 'works-console',
          role: 'example',
          frame: { type: 'browser', session: S2, event: 'save-bad', console: true, consoleLines: [2, 5], at: { page: 0, console: 2 } },
          lines: ['Вводим вес «60 кг» и сохраняем.', 'На странице — ничего. Где причина?', 'Console: красная строка, ответ 400.'],
          camera: [
            { at: 0, target: 'field:Вес, кг' },
            { at: 1, target: 'whole' },
          ],
          spots: [{ at: 2, target: 'console:3', title: 'Ошибка в Console', text: 'Сервер ответил кодом 400 и не сохранил подход. Скопируйте строку целиком: её текст нужен ИИ.' }],
        },
        {
          id: 'works-ask',
          role: 'example',
          frame: { type: 'agent', session: S2, event: 'ask-fix', at: { prompt: 0, steps: [2, 3], reply: 3 } },
          lines: ['Пишем агенту, что делали: вес «60 кг».', 'Что ждали: подход в списке или подсказку.', 'Что вышло — и сам текст ошибки, целиком.', 'Агент нашёл причину и поправил.'],
          spots: [{ at: 3, target: 'step:fix', title: '+12 −1', text: 'Агент добавил в файл 12 строк и убрал одну. Ниже — начало правки: новая строка подсвечена зелёным.' }],
        },
        {
          id: 'works-vague',
          role: 'mistake',
          frame: {
            type: 'board',
            title: 'Как попросить ИИ исправить ошибку',
            cards: [
              { title: '«Не работает, исправь»', text: ['ИИ не видит ошибку и гадает.', 'Пересказ своими словами — то же самое.'], at: 0, tone: 'err' },
              { title: 'Ошибка целиком', text: ['Текст из Console — копией, целиком.', 'Что делали, что ждали и что вышло.'], at: 1, tone: 'ok' },
            ],
          },
          lines: ['Ошибка — «не работает, исправь».', 'Верно — ошибка целиком и что делали.'],
          verdict: [
            { at: 0, kind: 'wrong' },
            { at: 1, kind: 'right' },
          ],
        },
      ],
    },
    {
      // sa6: модель, запрос (промпт), контекст, токен, агент, галлюцинация, MCP
      id: 'ai',
      title: 'Слова про ИИ',
      book: ['sa6'],
      scenes: [
        {
          id: 'ai-words',
          role: 'explain',
          frame: {
            type: 'figure',
            svg: aiwords,
            focus: [
              { at: 0, name: 'Модель', rect: [422, 84, 186, 98] },
              { at: 1, name: 'Запрос', rect: [224, 84, 166, 98] },
              { at: 2, name: 'Контекст', rect: [206, 42, 420, 162] },
              { at: 3, name: 'Токен', rect: [16, 212, 185, 125] },
              { at: 4, name: 'MCP', rect: [559, 212, 185, 125] },
            ],
          },
          lines: ['Модель — сам ИИ: Claude, GPT, Gemini.', 'Промпт — ваш запрос к модели.', 'Контекст — всё, что ИИ сейчас видит.', 'Токены — кусочки текста: по ним считают цену.', 'MCP подключает к агенту инструменты.'],
        },
        {
          id: 'ai-agent',
          role: 'example',
          frame: { type: 'agent', session: S2, event: 'ask-form', diffLines: { route: 0, page: 0, layout: 6 }, at: { prompt: 0, steps: [2, 3, 3, 3], reply: 4 } },
          lines: ['Агент не просто отвечает, а действует.', 'Просим форму «Сохранить подход».', 'Reading — агент читает файл страницы.', 'Edited — правит три файла.', 'И отвечает, что сделал.'],
          spots: [{ at: 2, until: 3, target: 'step:read-page', title: 'Reading', text: 'Агент прочитал файл страницы — теперь он в контексте: ИИ видит, что в проекте уже есть, и правит с учётом этого.' }],
        },
        {
          id: 'ai-hallucination',
          role: 'mistake',
          frame: {
            type: 'terminal',
            items: [
              { session: S2, event: 'start-dev', at: 1, lines: [1, 1] },
              { session: S2, event: 'scripts', at: 3 },
            ],
          },
          lines: ['Ошибка — сразу запустить команду ИИ.', 'npm отвечает: такого скрипта нет.', 'Галлюцинация: ИИ уверенно выдумал команду.', 'Верно — проверить список: npm run.'],
          camera: [
            { at: 0, target: 'line:start-dev:0' },
            { at: 2, target: 'whole' },
          ],
          spots: [{ at: 1, until: 2, target: 'line:start-dev:0', title: 'Missing script', text: 'В package.json нет такой команды. Список настоящих покажет npm run.' }],
          verdict: [
            { at: 0, kind: 'wrong' },
            { at: 3, kind: 'right' },
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
              { text: 'Приложение как ресторан: фронтенд, API, бэкенд и база данных.', at: 0 },
              { text: 'Ключи API — в .env.local, не в чат и не на GitHub.', at: 1 },
              { text: 'Перед крупной правкой — коммит: откат займёт минуту.', at: 2 },
              { text: 'Сначала у себя на localhost, потом staging, потом продакшен.', at: 3 },
              { text: 'Ошибку из Console — целиком: что делали, что ждали, что вышло.', at: 4 },
              { text: 'Команды от ИИ проверяйте: он может уверенно выдумать.', at: 5 },
            ],
          },
          lines: ['Четыре части — как в ресторане.', 'Ключи — в .env.local, не в чат.', 'Перед крупной правкой — коммит.', 'Сначала у себя, потом staging.', 'Ошибку отправляйте ИИ целиком.', 'А команды ИИ — проверяйте.'],
        },
      ],
    },
  ],
}
