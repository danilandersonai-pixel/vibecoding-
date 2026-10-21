import { Composition } from 'remotion'
import { Smoke } from './Smoke'

export function Root() {
  return <Composition id="smoke" component={Smoke} durationInFrames={60} fps={30} width={1280} height={720} />
}
