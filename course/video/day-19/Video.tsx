import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Why } from './scenes/S1Why'
import { S2Plan } from './scenes/S2Plan'
import { S3Like } from './scenes/S3Like'
import { S4Check } from './scenes/S4Check'
import { day19Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-why': S1Why,
  's2-plan': S2Plan,
  's3-like': S3Like,
  's4-check': S4Check,
}

// Ролик дня 19 — «Бета-тест: запуск»: четыре сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day19({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day19Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day19Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day19Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day19Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day19
