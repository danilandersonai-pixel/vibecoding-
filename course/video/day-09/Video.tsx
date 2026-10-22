import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Build } from './scenes/S1Build'
import { S2Pitfall } from './scenes/S2Pitfall'
import { S3Check } from './scenes/S3Check'
import { day09Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-build': S1Build,
  's2-pitfall': S2Pitfall,
  's3-check': S3Check,
}

// Ролик дня 9 — «Программы тренировок»: три сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day09({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day09Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day09Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day09Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day09Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day09
