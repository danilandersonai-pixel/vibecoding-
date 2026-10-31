import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch01 } from './lesson'

// Урок ch-01 «Вайб-кодинг: шкала, а не выключатель» (книга s5–s12, s77–s79): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-01 был 7857 кадров — новый не короче.
test('урок ch-01 проходит проверки', () => {
  expect(lessonProblems(ch01, { minFrames: 7857 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch01).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
