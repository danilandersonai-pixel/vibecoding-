import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Restaurant } from './scenes/S1Restaurant'
import { S2Parts } from './scenes/S2Parts'
import { S3Git } from './scenes/S3Git'
import { S4Site } from './scenes/S4Site'
import { S5Works } from './scenes/S5Works'
import { S6Ai } from './scenes/S6Ai'
import { chAbcScript } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-restaurant': S1Restaurant,
  's2-parts': S2Parts,
  's3-git': S3Git,
  's4-site': S4Site,
  's5-works': S5Works,
  's6-ai': S6Ai,
}

// Ролик главы «Азбука» — «Как устроено приложение»: шесть сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function ChAbc({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {chAbcScript.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(chAbcScript, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={chAbcScript.cues} />
      {showHotspots && <HotspotFrames hotspots={chAbcScript.hotspots} />}
    </AbsoluteFill>
  )
}

export default ChAbc
