import { CopyButton } from '../components/CopyButton'
import { IconCheck } from '../components/icons'
import type { PracticeStep } from '../content/schema'
import { useCourseProgress } from '../progress/courseProgress'
import { markStep } from '../progress/model'

// Шаги практики: каждый — карточка с галочкой, готовым запросом для Claude Code и критерием «готово».
// Счёт «Сделано a из b шагов» — в заголовке части (DayPage), здесь его нет
export function Practice({ dayId, steps }: { dayId: string; steps: PracticeStep[] }) {
  const { progress, update } = useCourseProgress()
  const done = progress.days[dayId]?.steps ?? {}
  return (
    <ol className="practice-steps">
      {steps.map((s, i) => (
        <li key={s.id} className={`practice-step paper${done[s.id] ? ' is-done' : ''}`}>
          <label className="practice-title">
            <input type="checkbox" checked={Boolean(done[s.id])} onChange={(e) => update((p) => markStep(p, dayId, s.id, e.target.checked))} />
            <span>
              Шаг {i + 1}. {s.title}
            </span>
          </label>
          {s.prompt && (
            <div className="prompt-box">
              <div className="prompt-head">
                <span className="kicker prompt-kicker">Запрос для Claude Code</span>
                <CopyButton text={s.prompt} tone="term" />
              </div>
              <pre>{s.prompt}</pre>
            </div>
          )}
          <p className="practice-done">
            <IconCheck size={20} />
            <span>
              <strong>Готово, когда:</strong> {s.done}
            </span>
          </p>
        </li>
      ))}
    </ol>
  )
}
