import { Composition } from 'remotion'
import { catalog } from './catalog'
import { KitShowcase } from './KitShowcase'
import { totalFrames } from './lib/timeline'
import { Smoke } from './Smoke'
import { TermCheck } from './term/TermCheck'

export function Root() {
  return (
    <>
      <Composition id="smoke" component={Smoke} durationInFrames={60} fps={30} width={1280} height={720} />
      <Composition id="kit-showcase" component={KitShowcase} durationInFrames={300} fps={30} width={1280} height={720} />
      <Composition id="term-check" component={TermCheck} durationInFrames={60} fps={30} width={1920} height={1080} defaultProps={{ mistake: false }} />
      {Object.entries(catalog).map(([id, v]) => (
        <Composition key={id} id={id} lazyComponent={v.load} durationInFrames={totalFrames(v.script)} fps={v.script.fps} width={v.script.width} height={v.script.height} />
      ))}
    </>
  )
}
