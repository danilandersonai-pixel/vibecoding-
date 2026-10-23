import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Autopilot } from './scenes/S1Autopilot'
import { S2Cost } from './scenes/S2Cost'
import { S3Intent } from './scenes/S3Intent'
import { S4Model } from './scenes/S4Model'
import { S5Bench } from './scenes/S5Bench'
import { S6Pay } from './scenes/S6Pay'
import { ch01Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-autopilot': S1Autopilot,
  's2-cost': S2Cost,
  's3-intent': S3Intent,
  's4-model': S4Model,
  's5-bench': S5Bench,
  's6-pay': S6Pay,
}

// Ролик главы 1 — «Вайб-кодинг: шкала, а не выключатель»: шесть сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch01({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch01Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch01Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch01Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch01Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch01
