# Вайб-курс

Интерактивный курс на 21 день по книге «Вайб-кодинг на практике»: карта дней, страница дня из шести блоков (зачем сегодня, теория, тест, практика, наставник, итог), объясняющие ролики на Remotion и наставник для Claude Code.

Опубликованная версия — приватная страница Claude: https://claude.ai/artifact/DQS4Yzu177UmpDCoXDuYJ4

Вид курса («обложка книги»: цвета, шрифты, главная, страница дня, плеер) описан в [`docs/superpowers/specs/2026-10-23-course-look-design.md`](../docs/superpowers/specs/2026-10-23-course-look-design.md), макеты — https://claude.ai/artifact/LHfwPSbDtbWzjbKYWuonzs

## Запуск на своём компьютере

```bash
cd course
npm install
npm run dev        # курс на http://localhost:5173
```

Вне Claude работает всё, кроме ИИ на странице; прогресс хранится в браузере.

## Проверки

```bash
npm test           # модульные тесты (Vitest)
npm run e2e        # сквозные тесты в браузере (Playwright)
npm run lint       # линтер
```

## Содержание

- `content/days/day-NN.json` — дни курса. Формат проверяет схема `src/content/schema.ts`: ошибка в данных ломает сборку, а не страницу.
- `content/figures/`, `content/glossary.json`, `src/styles/figures.css` — схемы и словарь, извлечённые из книги. Пересобрать после правки книги: `npm run extract:book`.
- Поиск по материалам дней, словарю и тексту книги открывается кнопкой «Поиск» в верхней строке, клавишей `/` или Ctrl+K (⌘K). Индекс книги для поиска — `content/book-index.json`, пересобирается командой `node scripts/extract-book.mjs ../vibe-coding-na-praktike-2026-10.html content` (её же запускает `npm run extract:book`).
- Экран «Граф знаний» (`#/graph`, кнопка «Граф» в верхней строке и в шапке дня) показывает книгу, словарь и курс одной картой связей. Данные — `content/graph.json` (узлы, связи, раскладка); пересобирать после правки книги (сначала `npm run extract:book`), словаря (`content/glossary.json`) или дней: `npm run build:graph`. Устаревший `graph.json` ловит `npm test`.
- `../mentor/` — навык наставника для Claude Code. Чек-листы дней пересобираются из файлов дней: `npm run build:mentor`.

## Ролики

```bash
npm run studio                                      # Remotion Studio: смотреть и править сцены
npm run render:video -- pilot-rls out/pilot-rls.mp4 # MP4 ролика по его id, проверка лимита 20 МБ
npm run render:all                                  # MP4 всех роликов каталога в out/<id>.mp4
npm run render:all -- day-08 day-09                 # или только перечисленных
```

Все ролики перечислены в `video/catalog.ts` (название, вид, сценарий, ленивая загрузка сцен): по нему строятся композиции Remotion и реестр сайта `src/video/registry.ts`. Ролик — урок набора «Репозиторий» в `video/lessons/<id>/`: данные в `lesson.ts`, сценарий для сайта — снимок `script.gen.json` (`buildLesson`); тайминги считаются из длины реплик, всё в кадре привязано к началу реплик (правила — `video/term/README.md`).

`render:all` пропускает ролики, у которых MP4 новее файлов урока (`video/lessons/<id>`) и общих деталей (`video/kit`, `video/term`, `video/sessions`, `video/actors`, `video/lib`, `video/theme.ts`), печатает таблицу «ролик — длительность — МБ» и завершается с ошибкой, если хоть один файл больше 20 МБ (лимит хранилища страницы).

Для рендера нужны браузер Chromium (путь — в `scripts/render-video.mjs`, по умолчанию `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`) и `ffprobe` из пакета ffmpeg.

### Как добавить ролик

Ролик — урок набора «Репозиторий»: каркас, правила кадра, нормы длины и ловушки — в [`video/term/README.md`](video/term/README.md).

1. Папка `video/lessons/<id>/`, по образцу соседних уроков:
   - `lesson.ts` — данные урока: сцены, реплики, кадры записей и схем, камера, пояснения и вердикты (всё привязано к номеру реплики);
   - `lesson.test.ts` — `lessonProblems(урок, { minFrames })` пуст, и снимок `buildLesson(урок).script` совпадает с `script.gen.json` (`toMatchFileSnapshot`);
   - `script.gen.json` — этот снимок, сценарий для сайта: `npx vitest run video/lessons/<id>`, при расхождении — `-u` и коммит вместе с уроком;
   - `script.ts` читает снимок, `Video.tsx` — ленивый кусок: `<LessonVideo lesson={урок} {...p} />` с пробросом пропов (ловушка 7 набора).
2. Запись в `video/catalog.ts`: название, вид (`chapter` или `day`), сценарий из `./lessons/<id>/script` и ленивая загрузка `./lessons/<id>/Video`.
3. Блок `{"type": "video", "videoId": "<id>", "title": "…"}` в `content/days/day-NN.json`.
4. Латиница в репликах читается голосом по таблице `SAY` в `src/video/narration.ts` — тест не пропустит реплику без строки произношения.
5. E2e: импорт `script.gen.json` урока в `SCRIPTS` и день в `DAYS` в `e2e/video-chapters.spec.ts` (ловушка 13 набора), затем `npm test` и `npm run e2e`.

MP4 ролика сейчас не загружается: «Скачать MP4» ждёт решения автора об озвучке ([`docs/superpowers/notes/2026-10-30-voiceover.md`](../docs/superpowers/notes/2026-10-30-voiceover.md)), словарь `MP4` в `src/video/registry.ts` пуст.

## Публикация

```bash
npm run build:artifact   # out/artifact/page.html + assets/ + book.html
```

Дальше Claude публикует `out/artifact/page.html` инструментом Artifact по тому же адресу: файлы из `assets/` и `book.html` передаются в `files`, возможности страницы — `sample`, `db`, `user`, `assets`, `downloads`. MP4 роликов в хранилище страницы сейчас нет: загрузка (`asset: true`) и адрес в словаре `MP4` в `src/video/registry.ts` — после решения автора об озвучке.
