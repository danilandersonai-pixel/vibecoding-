import { CopyButton } from '../components/CopyButton'
import type { PracticeStep } from '../content/schema'
import { useCourseProgress } from '../progress/courseProgress'
import { markStep } from '../progress/model'

// Шаги практики: галочка, готовый запрос для Claude Code и критерий «готово».
export function Practice({ dayId, steps }: { dayId: string; steps: PracticeStep[] }) {
  const { progress, update } = useCourseProgress()
  const done = progress.days[dayId]?.steps ?? {}
  const count = steps.filter((s) => done[s.id]).length
  return (
    <div className="practice">
      <p className="practice-count">
        Сделано {count} из {steps.length}
      </p>
      <ol className="practice-steps">
        {steps.map((s) => (
          <li key={s.id} className={`practice-step${done[s.id] ? ' is-done' : ''}`}>
            <label className="practice-title">
              <input type="checkbox" checked={Boolean(done[s.id])} onChange={(e) => update((p) => markStep(p, dayId, s.id, e.target.checked))} />
              <span>{s.title}</span>
            </label>
            {s.prompt && (
              <div className="prompt-box">
                <div className="prompt-head">
                  <span>Запрос</span>
                  <CopyButton text={s.prompt} />
                </div>
                <pre>{s.prompt}</pre>
              </div>
            )}
            <p className="practice-done">Готово, когда: {s.done}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
