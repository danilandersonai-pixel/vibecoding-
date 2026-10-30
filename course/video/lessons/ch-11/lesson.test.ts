import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch11 } from './lesson'

// Урок ch-11 «Что дальше» (книга s70–s76): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-11 был 7731 кадр — новый не короче.
test('урок ch-11 проходит проверки', () => {
  expect(lessonProblems(ch11, { minFrames: 7731 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch11).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
