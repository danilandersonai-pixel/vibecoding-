import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch04 } from './lesson'

// Урок ch-04 «Что остаётся человеку» (книга: вступление главы 4, s24–s28): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-04 был 7738 кадров — новый не короче.
test('урок ch-04 проходит проверки', () => {
  expect(lessonProblems(ch04, { minFrames: 7738 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch04).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
