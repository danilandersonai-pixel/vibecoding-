import { AbsoluteFill, Sequence } from 'remotion'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Coaches } from './scenes/S1Coaches'
import { S2Request } from './scenes/S2Request'
import { S3Attack } from './scenes/S3Attack'
import { S4Turnstile } from './scenes/S4Turnstile'
import { S5CheckYourself } from './scenes/S5CheckYourself'
import { pilotRlsScript } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-coaches': S1Coaches,
  's2-request': S2Request,
  's3-attack': S3Attack,
  's4-turnstile': S4Turnstile,
  's5-check': S5CheckYourself,
}

// Пилотный ролик дня 4: пять сцен подряд и субтитры поверх.
export function PilotRls() {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {pilotRlsScript.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(pilotRlsScript, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={pilotRlsScript.cues} />
    </AbsoluteFill>
  )
}
