import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day12 } from './lesson'

// Урок day-12 «Приглашение по ссылке» (книга s48, s49, s50, s51): проверки урока и снимок сценария для сайта.
// Прежний ролик day-12 был 4951 кадр — новый не короче.
test('урок day-12 проходит проверки', () => {
  expect(lessonProblems(day12, { minFrames: 4951 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day12).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
