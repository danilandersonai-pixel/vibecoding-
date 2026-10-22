import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Intro } from './scenes/S1Intro'
import { S2Pain } from './scenes/S2Pain'
import { S3Copy } from './scenes/S3Copy'
import { S4Check } from './scenes/S4Check'
import { day13Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-intro': S1Intro,
  's2-pain': S2Pain,
  's3-copy': S3Copy,
  's4-check': S4Check,
}

// Ролик дня 13 — «Своё отличие»: четыре сцены подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Day13({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {day13Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(day13Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={day13Script.cues} />
      {showHotspots && <HotspotFrames hotspots={day13Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Day13
