import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Taste } from './scenes/S1Taste'
import { S2Line } from './scenes/S2Line'
import { S3Collect } from './scenes/S3Collect'
import { S4Describe } from './scenes/S4Describe'
import { S5Build } from './scenes/S5Build'
import { S6Traps } from './scenes/S6Traps'
import { S7Passes } from './scenes/S7Passes'
import { ch12Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-taste': S1Taste,
  's2-line': S2Line,
  's3-collect': S3Collect,
  's4-describe': S4Describe,
  's5-build': S5Build,
  's6-traps': S6Traps,
  's7-passes': S7Passes,
}

// Ролик главы 12 — «Своё приложение по образцу»: семь сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch12({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch12Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch12Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch12Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch12Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch12
