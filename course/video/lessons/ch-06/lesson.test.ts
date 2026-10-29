import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch06 } from './lesson'

// Урок ch-06 «Прототип за вечер» (книга: вступление главы 6, s36–s41): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-06 был 8029 кадров — новый не короче.
test('урок ch-06 проходит проверки', () => {
  expect(lessonProblems(ch06, { minFrames: 8029 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch06).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
