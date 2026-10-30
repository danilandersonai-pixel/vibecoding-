import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { day08 } from './lesson'

// Урок day-08 «Отзывы и фоновые агенты» (книга s62, s64, s67, s68, s16): проверки урока и снимок сценария для сайта.
// Прежний ролик day-08 был 4496 кадров — новый не короче.
test('урок day-08 проходит проверки', () => {
  expect(lessonProblems(day08, { minFrames: 4496 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(day08).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
