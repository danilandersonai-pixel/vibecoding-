import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Model } from './scenes/S1Model'
import { S2Question } from './scenes/S2Question'
import { S3Prompt } from './scenes/S3Prompt'
import { S4Tools } from './scenes/S4Tools'
import { S5Loop } from './scenes/S5Loop'
import { S6Decide } from './scenes/S6Decide'
import { S7Traps } from './scenes/S7Traps'
import { ch06Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-model': S1Model,
  's2-question': S2Question,
  's3-prompt': S3Prompt,
  's4-tools': S4Tools,
  's5-loop': S5Loop,
  's6-decide': S6Decide,
  's7-traps': S7Traps,
}

// Ролик главы 6 — «Прототип за вечер»: семь сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch06({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch06Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch06Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch06Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch06Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch06
