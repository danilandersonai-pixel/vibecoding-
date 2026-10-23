import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Cake } from './scenes/S1Cake'
import { S2Ckokf } from './scenes/S2Ckokf'
import { S3Specific } from './scenes/S3Specific'
import { S4Loop } from './scenes/S4Loop'
import { S5Ask } from './scenes/S5Ask'
import { S6Spec } from './scenes/S6Spec'
import { ch02Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-cake': S1Cake,
  's2-ckokf': S2Ckokf,
  's3-specific': S3Specific,
  's4-loop': S4Loop,
  's5-ask': S5Ask,
  's6-spec': S6Spec,
}

// Ролик главы 2 — «Как говорить с ИИ, чтобы он понял»: шесть сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch02({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch02Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch02Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch02Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch02Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch02
