import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch02 } from './lesson'

// Урок ch-02 «Как говорить с ИИ, чтобы он понял» (книга s14–s19): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-02 был 7751 кадр — новый не короче.
test('урок ch-02 проходит проверки', () => {
  expect(lessonProblems(ch02, { minFrames: 7751 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch02).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
