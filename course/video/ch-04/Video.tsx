import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Chess } from './scenes/S1Chess'
import { S2Delegate } from './scenes/S2Delegate'
import { S3TShape } from './scenes/S3TShape'
import { S4Tutor } from './scenes/S4Tutor'
import { S5Mentor } from './scenes/S5Mentor'
import { S6Growth } from './scenes/S6Growth'
import { ch04Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-chess': S1Chess,
  's2-delegate': S2Delegate,
  's3-t-shape': S3TShape,
  's4-tutor': S4Tutor,
  's5-mentor': S5Mentor,
  's6-growth': S6Growth,
}

// Ролик главы 4 — «Что остаётся человеку»: шесть сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch04({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch04Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch04Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch04Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch04Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch04
