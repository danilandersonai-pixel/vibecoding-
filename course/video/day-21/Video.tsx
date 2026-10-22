import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Build } from './scenes/S1Build'
import { S2Policy } from './scenes/S2Policy'
import { S3Check } from './scenes/S3Check'
import { S4Next } from './scenes/S4Next'
import { day21Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-build': S1Build,
  's2-policy': S2Policy,
  's3-check': S3Check,
  's4-next': S4Next,
}

// Ролик дня 21 — «Запуск»: четыре сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day21({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day21Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day21Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day21Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day21Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day21
