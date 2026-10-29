import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch05 } from './lesson'

// Урок ch-05 «Читать код, который написал ИИ» (книга: вступление главы 5, s29–s35): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-05 был 7921 кадр — новый не короче.
test('урок ch-05 проходит проверки', () => {
  expect(lessonProblems(ch05, { minFrames: 7921 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch05).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
