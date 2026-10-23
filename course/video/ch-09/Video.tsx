import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Essay } from './scenes/S1Essay'
import { S2Owner } from './scenes/S2Owner'
import { S3License } from './scenes/S3License'
import { S4Honest } from './scenes/S4Honest'
import { S5Bias } from './scenes/S5Bias'
import { S6Rules } from './scenes/S6Rules'
import { ch09Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-essay': S1Essay,
  's2-owner': S2Owner,
  's3-license': S3License,
  's4-honest': S4Honest,
  's5-bias': S5Bias,
  's6-rules': S6Rules,
}

// Ролик главы 9 — «Этика вайб-кодинга»: шесть сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch09({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch09Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch09Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch09Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch09Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch09
