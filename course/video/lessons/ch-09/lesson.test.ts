import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch09 } from './lesson'

// Урок ch-09 «Этика вайб-кодинга» (книга s57–s61): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-09 был 7905 кадров — новый не короче.
test('урок ch-09 проходит проверки', () => {
  expect(lessonProblems(ch09, { minFrames: 7905 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch09).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
