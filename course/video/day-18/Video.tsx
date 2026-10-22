import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Today } from './scenes/S1Today'
import { S2Build } from './scenes/S2Build'
import { S3Double } from './scenes/S3Double'
import { S4Check } from './scenes/S4Check'
import { day18Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-today': S1Today,
  's2-build': S2Build,
  's3-double': S3Double,
  's4-check': S4Check,
}

// Ролик дня 18 — «Тренировка без интернета»: четыре сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day18({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day18Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day18Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day18Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day18Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day18
