import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { chAbc } from './lesson'

// Урок ch-abc «Как устроено приложение» (книга sa1–sa6): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-abc был 7789 кадров — новый не короче.
test('урок ch-abc проходит проверки', () => {
  expect(lessonProblems(chAbc, { minFrames: 7789 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(chAbc).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
