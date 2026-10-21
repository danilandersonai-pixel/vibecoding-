import { AbsoluteFill } from 'remotion'
import { Client } from './actors/Client'
import { Coach } from './actors/Coach'
import { Database } from './actors/Database'
import { Hacker } from './actors/Hacker'
import { Packet } from './actors/Packet'
import { Phone } from './actors/Phone'
import { Server } from './actors/Server'
import { Turnstile } from './actors/Turnstile'
import { Subtitles } from './lib/Subtitles'
import { theme } from './theme'

// Проверочная композиция: все актёры в одном кадре и субтитры.
export function Smoke() {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      <svg viewBox="0 0 1280 720" width={1280} height={720}>
        <Coach x={110} y={170} label="Тренер" enterAt={0} />
        <Client x={270} y={170} label="Подопечный" highlight />
        <Hacker x={430} y={170} label="Злоумышленник" />
        <Phone x={600} y={190} />
        <Server x={790} y={170} />
        <Turnstile x={1010} y={170} open={1} />
        <Packet x={200} y={440} text="client/17" />
        <Database x={560} y={470} rows={[{ text: 'Анна · жим 60', color: theme.accent }, { text: 'Олег · присед 90', color: theme.ok, dim: true }]} />
      </svg>
      <Subtitles cues={[{ from: 0, to: 60, text: 'Субтитры всегда в кадре' }]} />
    </AbsoluteFill>
  )
}
