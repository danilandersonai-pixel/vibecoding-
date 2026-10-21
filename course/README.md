# Вайб-курс

Интерактивный курс на 21 день по книге «Вайб-кодинг на практике»: карта дней, страница дня из шести блоков (зачем сегодня, теория, тест, практика, наставник, итог), объясняющие ролики на Remotion и наставник для Claude Code.

Опубликованная версия — приватная страница Claude: https://claude.ai/artifact/DQS4Yzu177UmpDCoXDuYJ4

## Запуск на своём компьютере

```bash
cd course
npm install
npm run dev        # курс на http://localhost:5173
```

Вне Claude работает всё, кроме ИИ на странице и скачивания MP4; прогресс хранится в браузере.

## Проверки

```bash
npm test           # модульные тесты (Vitest)
npm run e2e        # сквозные тесты в браузере (Playwright)
npm run lint       # линтер
```

## Содержание

- `content/days/day-NN.json` — дни курса. Формат проверяет схема `src/content/schema.ts`: ошибка в данных ломает сборку, а не страницу.
- `content/figures/`, `content/glossary.json`, `src/styles/figures.css` — схемы и словарь, извлечённые из книги. Пересобрать после правки книги: `npm run extract:book`.
- `../mentor/` — навык наставника для Claude Code. Чек-листы дней пересобираются из файлов дней: `npm run build:mentor`.

## Ролики

```bash
npm run studio                                      # Remotion Studio: смотреть и править сцены
npm run render:video -- pilot-rls out/pilot-rls.mp4 # MP4 ролика по его id, проверка лимита 20 МБ
```

Все ролики перечислены в `video/catalog.ts` (название, вид, сценарий, ленивая загрузка сцен): по нему строятся композиции Remotion и реестр сайта `src/video/registry.ts`. Сценарий ролика — например `video/pilot-rls/script.ts`: тайминги считаются из длины реплик, анимации сцен привязаны к началу реплик.

## Публикация

```bash
npm run build:artifact   # out/artifact/page.html + assets/ + book.html
```

Дальше Claude публикует `out/artifact/page.html` инструментом Artifact по тому же адресу: файлы из `assets/` и `book.html` передаются в `files`, возможности страницы — `sample`, `db`, `user`, `assets`, `downloads`. MP4 загружается в хранилище страницы (`asset: true`), а его адрес вписывается в `src/video/registry.ts`.
