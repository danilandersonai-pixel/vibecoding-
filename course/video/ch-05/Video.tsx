import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Repair } from './scenes/S1Repair'
import { S2Passes } from './scenes/S2Passes'
import { S3Majority } from './scenes/S3Majority'
import { S4Trace } from './scenes/S4Trace'
import { S5Bisect } from './scenes/S5Bisect'
import { S6Refactor } from './scenes/S6Refactor'
import { S7Tests } from './scenes/S7Tests'
import { ch05Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-repair': S1Repair,
  's2-passes': S2Passes,
  's3-majority': S3Majority,
  's4-trace': S4Trace,
  's5-bisect': S5Bisect,
  's6-refactor': S6Refactor,
  's7-tests': S7Tests,
}

// Ролик главы 5 — «Читать код, который написал ИИ»: семь сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch05({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch05Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch05Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch05Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch05Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch05
