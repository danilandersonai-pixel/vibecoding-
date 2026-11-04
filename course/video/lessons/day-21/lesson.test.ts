import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day21 } from './lesson'

// Урок day-21 «Запуск» (книга s81, s45, s47, s57, s60, s76): проверки урока и снимок сценария для сайта.
// Прежний ролик day-21 был 5110 кадров — новый не короче.
test('урок day-21 проходит проверки', () => {
  expect(lessonProblems(day21, { minFrames: 5110 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day21).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
