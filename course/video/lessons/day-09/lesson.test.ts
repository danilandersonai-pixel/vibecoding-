import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day09 } from './lesson'

// Урок day-09 «Программы тренировок» (книга s43, s22, s34): проверки урока и снимок сценария для сайта.
// Прежний ролик day-09 был 4399 кадров — новый не короче.
test('урок day-09 проходит проверки', () => {
  expect(lessonProblems(day09, { minFrames: 4399 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day09).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
