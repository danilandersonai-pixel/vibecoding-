import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day17 } from './lesson'

// Урок day-17 «Замеры и фото прогресса» (книга s43, s48, s82, s60, s22): проверки урока и снимок сценария для сайта.
// Прежний ролик day-17 был 4999 кадров — новый не короче.
test('урок day-17 проходит проверки', () => {
  expect(lessonProblems(day17, { minFrames: 4999 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day17).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
