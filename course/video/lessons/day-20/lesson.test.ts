import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day20 } from './lesson'

// Урок day-20 «Бета-тест: исправления» (книга s22, s19, s32, s34, s51, s54): проверки урока и снимок сценария для сайта.
// Прежний ролик day-20 был 5232 кадра — новый не короче.
test('урок day-20 проходит проверки', () => {
  expect(lessonProblems(day20, { minFrames: 5232 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day20).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
