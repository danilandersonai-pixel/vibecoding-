import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Why } from './scenes/S1Why'
import { S2Build } from './scenes/S2Build'
import { S3All } from './scenes/S3All'
import { S4Check } from './scenes/S4Check'
import { day20Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-why': S1Why,
  's2-build': S2Build,
  's3-all': S3All,
  's4-check': S4Check,
}

// Ролик дня 20 — «Бета-тест: исправления»: четыре сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day20({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day20Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day20Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day20Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day20Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day20
