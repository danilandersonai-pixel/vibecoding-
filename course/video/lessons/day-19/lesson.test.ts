import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day19 } from './lesson'

// Урок day-19 «Бета-тест: запуск» (книга s38, s41, s55, s16, s45): проверки урока и снимок сценария для сайта.
// Прежний ролик day-19 был 4568 кадров — новый не короче.
test('урок day-19 проходит проверки', () => {
  expect(lessonProblems(day19, { minFrames: 4568 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day19).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
