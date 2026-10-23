import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Monday } from './scenes/S1Monday'
import { S2Build } from './scenes/S2Build'
import { S3Empty } from './scenes/S3Empty'
import { S4Check } from './scenes/S4Check'
import { day10Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-monday': S1Monday,
  's2-build': S2Build,
  's3-empty': S3Empty,
  's4-check': S4Check,
}

// Ролик дня 10 — «Рекорды и отчёты»: четыре сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day10({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day10Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day10Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day10Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day10Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day10
