import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day11 } from './lesson'

// Урок day-11 «Комментарии и уведомления» (книга s43, s44, s48, s51): проверки урока и снимок сценария для сайта.
// Прежний ролик day-11 был 5102 кадра — новый не короче.
test('урок day-11 проходит проверки', () => {
  expect(lessonProblems(day11, { minFrames: 5102 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day11).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
