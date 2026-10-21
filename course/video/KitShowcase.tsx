import { AbsoluteFill, Sequence } from 'remotion'
import { Client } from './actors/Client'
import type { Pose } from './actors/Person'
import { KitScene } from './kit/KitScene'
import { AgentChat } from './kit/screens/AgentChat'
import { Chart } from './kit/screens/Chart'
import { Checklist } from './kit/screens/Checklist'
import { Diff } from './kit/screens/Diff'
import { Editor } from './kit/screens/Editor'
import { Spotlight } from './kit/screens/Spotlight'
import { Terminal } from './kit/screens/Terminal'
import { theme } from './theme'

const HALF = 150

const POSES: [Pose, string][] = [
  ['stand', 'стоит'],
  ['point', 'показывает'],
  ['think', 'думает'],
  ['cheer', 'рад'],
  ['surprised', 'удивлён'],
]

// Витрина набора: все экраны и позы героев в одном ролике, чтобы проверить их глазами.
// Первая половина (кадры 0–149) — терминал, редактор, изменения, столбики; вторая — чат, чек-лист, линия, позы и луч.
export function KitShowcase() {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      <Sequence from={0} durationInFrames={HALF} name="screens-1">
        <KitScene chip="Набор · экраны 1/2" duration={HALF}>
          <Terminal
            x={40}
            y={84}
            w={600}
            at={0}
            lines={[
              { text: 'npm test', kind: 'cmd' },
              { text: '> trainer@1.0.0 test', kind: 'out' },
              { text: '✓ 12 тестов пройдено', kind: 'ok' },
              { text: '✗ нет файла client.ts', kind: 'err' },
              { text: 'git commit -m "тренировки"', kind: 'cmd' },
              { text: '[main 3f2a1c9] тренировки', kind: 'out' },
            ]}
          />
          <Editor
            x={660}
            y={84}
            w={580}
            at={6}
            file="client.ts"
            lines={['type Workout = { kind: string }', '', 'function addWorkout(client, kind) {', '  const workout = { kind, done: false }', '  client.workouts.push(workout)', '}']}
            highlight={[4]}
          />
          <Diff
            x={40}
            y={372}
            w={600}
            at={12}
            lines={[
              { text: 'function addWorkout(client, kind) {', kind: 'same' },
              { text: '  const workout = { kind }', kind: 'del' },
              { text: '  const workout = { kind, done: false }', kind: 'add' },
              { text: '  client.workouts.push(workout)', kind: 'same' },
              { text: '  client.updatedAt = Date.now()', kind: 'add' },
              { text: '  return workout', kind: 'same' },
              { text: '}', kind: 'same' },
            ]}
          />
          <Chart x={660} y={372} w={580} at={18} kind="bars" values={[3, 4, 2, 5, 4, 6, 5]} labels={['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']} unit="тренировок у Анны и Олега" />
        </KitScene>
      </Sequence>
      <Sequence from={HALF} durationInFrames={HALF} name="screens-2">
        <KitScene chip="Набор · экраны 2/2" duration={HALF}>
          <AgentChat
            x={40}
            y={84}
            w={600}
            at={0}
            messages={[
              { from: 'me', text: 'Добавь Олегу тренировку на среду' },
              { from: 'agent', text: 'Готово: у Олега в среду силовая. Проверил тесты, все проходят.' },
              { from: 'me', text: 'Спасибо!' },
            ]}
          />
          {POSES.map(([pose, label], i) => (
            <Client key={pose} x={100 + i * 120} y={520} scale={0.7} pose={pose} label={label} />
          ))}
          <Checklist x={660} y={84} w={580} at={6} items={['Тест на добавление тренировки', 'Защита данных Анны и Олега', 'Проверка на телефоне', 'Выкладка на сервер']} done={3} />
          <Chart x={660} y={332} w={580} at={12} kind="line" values={[60, 62.5, 65, 65, 70, 72.5]} labels={['нед 1', 'нед 2', 'нед 3', 'нед 4', 'нед 5', 'нед 6']} unit="жим лёжа у Анны, кг" />
          <Spotlight x={1175} y={402} r={80} at={100} />
        </KitScene>
      </Sequence>
    </AbsoluteFill>
  )
}
