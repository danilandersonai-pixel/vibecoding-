import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day15 } from './lesson'

// Урок day-15 «Первое знакомство и полировка» (книга s36, s38, s41, s45, s59, s71): проверки урока и снимок сценария для сайта.
// Прежний ролик day-15 был 4683 кадра — новый не короче.
test('урок day-15 проходит проверки', () => {
  expect(lessonProblems(day15, { minFrames: 4683 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day15).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
