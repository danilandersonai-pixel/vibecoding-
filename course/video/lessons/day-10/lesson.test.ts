import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day10 } from './lesson'

// Урок day-10 «Рекорды и отчёты» (книга s22, s34, s45): проверки урока и снимок сценария для сайта.
// Прежний ролик day-10 был 4912 кадров — новый не короче.
test('урок day-10 проходит проверки', () => {
  expect(lessonProblems(day10, { minFrames: 4912 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day10).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
