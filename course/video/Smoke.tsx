import { AbsoluteFill } from 'remotion'
import { Agent } from './actors/Agent'
import { Client } from './actors/Client'
import { Coach } from './actors/Coach'
import { Database } from './actors/Database'
import { Hacker } from './actors/Hacker'
import { Packet } from './actors/Packet'
import type { Pose } from './actors/Person'
import { Phone } from './actors/Phone'
import { Server } from './actors/Server'
import { Turnstile } from './actors/Turnstile'
import { Subtitles } from './lib/Subtitles'
import { theme } from './theme'

const poses: Pose[] = ['stand', 'point', 'think', 'cheer', 'surprised']

// Проверочная композиция: все актёры в одном кадре и субтитры.
export function Smoke() {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      <svg viewBox="0 0 1280 720" width={1280} height={720}>
        <Coach x={90} y={150} label="Тренер" enterAt={0} />
        <Client x={260} y={150} label="Подопечный" highlight />
        <Hacker x={450} y={150} label="Злоумышленник" />
        <Phone x={650} y={170} />
        <Server x={850} y={150} />
        <Turnstile x={1070} y={150} open={1} />
        {/* Пять поз и два настроения */}
        {poses.map((pose, i) => (
          <Client key={pose} x={90 + i * 140} y={360} scale={0.7} pose={pose} label={pose} />
        ))}
        <Coach x={810} y={360} scale={0.7} mood="happy" pose="cheer" label="happy" />
        <Hacker x={950} y={360} scale={0.7} mood="worried" pose="surprised" label="worried" />
        {/* Агент в трёх состояниях */}
        <Agent x={90} y={520} scale={0.7} pose="idle" />
        <Agent x={250} y={520} scale={0.7} pose="working" label="Агент · working" />
        <Agent x={410} y={520} scale={0.7} pose="done" label="Агент · done" />
        <Packet x={640} y={520} text="client/17" />
        <Database x={950} y={520} scale={0.6} rows={[{ text: 'Анна · жим 60', color: theme.accent }, { text: 'Олег · присед 90', color: theme.ok, dim: true }]} />
      </svg>
      <Subtitles cues={[{ from: 0, to: 60, text: 'Субтитры всегда в кадре' }]} />
    </AbsoluteFill>
  )
}
