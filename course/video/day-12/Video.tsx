import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Today } from './scenes/S1Today'
import { S2Invite } from './scenes/S2Invite'
import { S3Forever } from './scenes/S3Forever'
import { S4Check } from './scenes/S4Check'
import { day12Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-today': S1Today,
  's2-invite': S2Invite,
  's3-forever': S3Forever,
  's4-check': S4Check,
}

// Ролик дня 12 — «Приглашение по ссылке»: четыре сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day12({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day12Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day12Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day12Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day12Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day12
