import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day18 } from './lesson'

// Урок day-18 «Тренировка без интернета» (книга s22, s23, s25, s43, s34, s87): проверки урока и снимок сценария для сайта.
// Прежний ролик day-18 был 5205 кадров — новый не короче.
test('урок day-18 проходит проверки', () => {
  expect(lessonProblems(day18, { minFrames: 5205 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day18).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
