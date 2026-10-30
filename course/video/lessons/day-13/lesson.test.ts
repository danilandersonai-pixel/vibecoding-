import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day13 } from './lesson'

// Урок day-13 «Своё отличие» (книга s87, s88, s89, s90, s36, s38): проверки урока и снимок сценария для сайта.
// Прежний ролик day-13 был 4535 кадров — новый не короче.
test('урок day-13 проходит проверки', () => {
  expect(lessonProblems(day13, { minFrames: 4535 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day13).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
