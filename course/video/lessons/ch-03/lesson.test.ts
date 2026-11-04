import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { ch03 } from './lesson'

// Урок ch-03 «Проблема 70%» (книга: вступление главы 3, s21–s23): проверки урока и снимок сценария для сайта.
// Прежний ролик ch-03 был 7951 кадр — новый не короче.
test('урок ch-03 проходит проверки', () => {
  expect(lessonProblems(ch03, { minFrames: 7951 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(ch03).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
