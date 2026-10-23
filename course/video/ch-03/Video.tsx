import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Renovation } from './scenes/S1Renovation'
import { S2Log } from './scenes/S2Log'
import { S3Symptoms } from './scenes/S3Symptoms'
import { S4Practice } from './scenes/S4Practice'
import { S5Step } from './scenes/S5Step'
import { S6Rollback } from './scenes/S6Rollback'
import { ch03Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-renovation': S1Renovation,
  's2-log': S2Log,
  's3-symptoms': S3Symptoms,
  's4-practice': S4Practice,
  's5-step': S5Step,
  's6-rollback': S6Rollback,
}

// Ролик главы 3 — «Проблема 70%»: шесть сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch03({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch03Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch03Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch03Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch03Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch03
