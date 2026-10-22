import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Week } from './scenes/S1Week'
import { S2Sort } from './scenes/S2Sort'
import { S3Vague } from './scenes/S3Vague'
import { S4Check } from './scenes/S4Check'
import { day08Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-week': S1Week,
  's2-sort': S2Sort,
  's3-vague': S3Vague,
  's4-check': S4Check,
}

// Ролик дня 8 — «Отзывы и фоновые агенты»: четыре сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day08({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day08Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day08Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day08Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day08Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day08
