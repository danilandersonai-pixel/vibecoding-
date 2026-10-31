import { Composition } from 'remotion'
import { catalog } from './catalog'
import { KitShowcase } from './KitShowcase'
import { totalFrames } from './lib/timeline'
import { Smoke } from './Smoke'
import { buildLesson } from './term/build'
import { fixtureLesson } from './term/fixture-lesson'
import { LessonVideo } from './term/LessonVideo'

// Урок-фикстура набора «Репозиторий» (video/term/fixture-lesson.ts): на нём смотрят общий ролик глазами —
// node scripts/lesson-stills.mjs term-lesson video/term/fixture-lesson.gen.json <папка>; debugSpots — рамки пояснений.
const TERM_LESSON = buildLesson(fixtureLesson).script

function TermLesson({ debugSpots }: { debugSpots: boolean }) {
  return <LessonVideo lesson={fixtureLesson} debugSpots={debugSpots} />
}

export function Root() {
  return (
    <>
      <Composition id="smoke" component={Smoke} durationInFrames={60} fps={30} width={1280} height={720} />
      <Composition id="kit-showcase" component={KitShowcase} durationInFrames={300} fps={30} width={1280} height={720} />
      <Composition id="term-lesson" component={TermLesson} durationInFrames={totalFrames(TERM_LESSON)} fps={30} width={1920} height={1080} defaultProps={{ debugSpots: false }} />
      {Object.entries(catalog).map(([id, v]) => (
        <Composition key={id} id={id} lazyComponent={v.load} durationInFrames={totalFrames(v.script)} fps={v.script.fps} width={v.script.width} height={v.script.height} />
      ))}
    </>
  )
}
