import { AbsoluteFill, Sequence } from 'remotion'
import { HotspotFrames } from '../kit/HotspotFrames'
import { sceneStart } from '../lib/timeline'
import { Subtitles } from '../lib/Subtitles'
import { theme } from '../theme'
import { S1Stairs } from './scenes/S1Stairs'
import { S2Tests } from './scenes/S2Tests'
import { S3Incident } from './scenes/S3Incident'
import { S4Design } from './scenes/S4Design'
import { S5Pm } from './scenes/S5Pm'
import { S6Roles } from './scenes/S6Roles'
import { S7Words } from './scenes/S7Words'
import { ch11Script } from './script'

const SCENES: Record<string, () => React.JSX.Element> = {
  's1-stairs': S1Stairs,
  's2-tests': S2Tests,
  's3-incident': S3Incident,
  's4-design': S4Design,
  's5-pm': S5Pm,
  's6-roles': S6Roles,
  's7-words': S7Words,
}

// Ролик главы 11 — «Что дальше»: семь сцен подряд и субтитры поверх.
// showHotspots — рамки горячих точек для проверочных кадров; в обычном рендере и на сайте выключено.
export function Ch11({ showHotspots = false }: { showHotspots?: boolean }) {
  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      {ch11Script.scenes.map((s) => {
        const Scene = SCENES[s.id]
        return (
          <Sequence key={s.id} from={sceneStart(ch11Script, s.id)} durationInFrames={s.durationInFrames} name={s.id}>
            <Scene />
          </Sequence>
        )
      })}
      <Subtitles cues={ch11Script.cues} />
      {showHotspots && <HotspotFrames hotspots={ch11Script.hotspots} />}
    </AbsoluteFill>
  )
}

export default Ch11
