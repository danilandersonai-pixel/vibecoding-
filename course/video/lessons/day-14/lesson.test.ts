import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day14 } from './lesson'

// Урок day-14 «Надёжность» (книга s34, s45, s52, s55, s82): проверки урока и снимок сценария для сайта.
// Прежний ролик day-14 был 4985 кадров — новый не короче.
test('урок day-14 проходит проверки', () => {
  expect(lessonProblems(day14, { minFrames: 4985 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day14).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
