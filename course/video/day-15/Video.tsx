import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Today } from './scenes/S1Today'
import { S2First } from './scenes/S2First'
import { S3Empty } from './scenes/S3Empty'
import { S4Check } from './scenes/S4Check'
import { day15Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-today': S1Today,
  's2-first': S2First,
  's3-empty': S3Empty,
  's4-check': S4Check,
}

// Ролик дня 15 — «Первое знакомство и полировка»: четыре сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day15({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day15Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day15Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day15Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day15Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day15
