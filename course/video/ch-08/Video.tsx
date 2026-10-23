import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Bakery } from './scenes/S1Bakery'
import { S2Injection } from './scenes/S2Injection'
import { S3Limits } from './scenes/S3Limits'
import { S4Audit } from './scenes/S4Audit'
import { S5N1 } from './scenes/S5N1'
import { S6Ci } from './scenes/S6Ci'
import { S7Rollout } from './scenes/S7Rollout'
import { ch08Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-bakery': S1Bakery,
  's2-injection': S2Injection,
  's3-limits': S3Limits,
  's4-audit': S4Audit,
  's5-n1': S5N1,
  's6-ci': S6Ci,
  's7-rollout': S7Rollout,
}

// Ролик главы 8 — «Безопасность и надёжность»: семь сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch08({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch08Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch08Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch08Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch08Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch08
