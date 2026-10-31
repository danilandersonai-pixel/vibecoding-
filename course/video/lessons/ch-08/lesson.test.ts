import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch08 } from './lesson'

// Урок ch-08 «Безопасность и надёжность» (книга s48–s56, s82): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-08 был 7987 кадров — новый не короче.
test('урок ch-08 проходит проверки', () => {
  expect(lessonProblems(ch08, { minFrames: 7987 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch08).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
