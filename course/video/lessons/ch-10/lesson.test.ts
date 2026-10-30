import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch10 } from './lesson'

// Урок ch-10 «Фоновые агенты» (книга s62–s69, s83): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-10 был 7984 кадра — новый не короче.
test('урок ch-10 проходит проверки', () => {
  expect(lessonProblems(ch10, { minFrames: 7984 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch10).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
