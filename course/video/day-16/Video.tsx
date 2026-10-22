import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Build } from './scenes/S1Build'
import { S2Units } from './scenes/S2Units'
import { S3Check } from './scenes/S3Check'
import { day16Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-build': S1Build,
  's2-units': S2Units,
  's3-check': S3Check,
}

// Ролик дня 16 — «Питание»: три сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day16({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day16Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day16Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day16Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day16Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day16
