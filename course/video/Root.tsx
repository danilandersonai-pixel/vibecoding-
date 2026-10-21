import { Composition } from 'remotion'
import { KitShowcase } from './KitShowcase'
import { totalFrames } from './lib/timeline'
import { PilotRls } from './pilot-rls/PilotRls'
import { pilotRlsScript } from './pilot-rls/script'
import { Smoke } from './Smoke'

export function Root() {
  return (
    <>
      <Composition id="smoke" component={Smoke} durationInFrames={60} fps={30} width={1280} height={720} />
      <Composition id="kit-showcase" component={KitShowcase} durationInFrames={300} fps={30} width={1280} height={720} />
      <Composition id="pilot-rls" component={PilotRls} durationInFrames={totalFrames(pilotRlsScript)} fps={30} width={1280} height={720} />
    </>
  )
}
