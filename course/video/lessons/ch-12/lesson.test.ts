import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch12 } from './lesson'

// Урок ch-12 «Своё приложение по образцу» (книга s84–s92): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-12 был 7894 кадра — новый не короче.
test('урок ch-12 проходит проверки', () => {
  expect(lessonProblems(ch12, { minFrames: 7894 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch12).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
