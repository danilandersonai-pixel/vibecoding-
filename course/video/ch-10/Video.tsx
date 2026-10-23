import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Intern } from './scenes/S1Intern'
import { S2Agent } from './scenes/S2Agent'
import { S3Parallel } from './scenes/S3Parallel'
import { S4Stuck } from './scenes/S4Stuck'
import { S5Task } from './scenes/S5Task'
import { S6Accept } from './scenes/S6Accept'
import { S7Tools } from './scenes/S7Tools'
import { ch10Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-intern': S1Intern,
  's2-agent': S2Agent,
  's3-parallel': S3Parallel,
  's4-stuck': S4Stuck,
  's5-task': S5Task,
  's6-accept': S6Accept,
  's7-tools': S7Tools,
}

// Ролик главы 10 — «Фоновые агенты»: семь сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch10({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch10Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch10Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch10Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch10Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch10
