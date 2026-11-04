import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day16 } from './lesson'

// Урок day-16 «Питание» (книга s22, s34, s43, s51, s60): проверки урока и снимок сценария для сайта.
// Прежний ролик day-16 был 5040 кадров — новый не короче.
test('урок day-16 проходит проверки', () => {
  expect(lessonProblems(day16, { minFrames: 5040 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day16).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
