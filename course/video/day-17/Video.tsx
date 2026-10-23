import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Today } from './scenes/S1Today'
import { S2Build } from './scenes/S2Build'
import { S3Public } from './scenes/S3Public'
import { S4Check } from './scenes/S4Check'
import { day17Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-today': S1Today,
  's2-build': S2Build,
  's3-public': S3Public,
  's4-check': S4Check,
}

// Ролик дня 17 — «Замеры и фото прогресса»: четыре сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day17({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day17Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day17Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day17Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day17Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day17
