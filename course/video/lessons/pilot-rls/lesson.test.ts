import { expect, test } from 'vitest'
import { buildLesson } from '../../term/build'
import { lessonProblems } from '../../term/problems'
import { pilotRls } from './lesson'

// Урок pilot-rls «Почему тренер не увидит чужих подопечных» (книга s42–s47, s81): проверки урока и снимок сценария для сайта.
// Прежний ролик pilot-rls был 6098 кадров — новый не короче.
test('урок pilot-rls проходит проверки', () => {
  expect(lessonProblems(pilotRls, { minFrames: 6098 })).toEqual([])
})

test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(pilotRls).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
