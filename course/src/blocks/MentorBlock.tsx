import { CopyButton } from '../components/CopyButton'
import type { Day, MentorCheck } from '../content/schema'
import { useCourseProgress } from '../progress/courseProgress'
import { setMentorAccepted } from '../progress/model'

const AUTO_LABEL: Record<NonNullable<MentorCheck['auto']>, string> = {
  tests: 'запустит тесты',
  lint: 'запустит линтер',
  secrets: 'поищет секреты',
  rls: 'попробует открыть чужие данные',
  file: 'проверит файл',
}

// Наставник: команда для Claude Code в проекте приложения, чек-лист дня и отметка «принял».
export function MentorBlock({ day }: { day: Day }) {
  const { progress, update } = useCourseProgress()
  const command = day.mentor.command || `/mentor ${day.number}`
  const accepted = progress.days[day.id]?.mentorAccepted ?? false
  return (
    <div className="mentor">
      <p>Когда практика сделана, откройте проект приложения в Claude Code и запустите наставника:</p>
      <div className="mentor-command">
        <code>{command}</code>
        <CopyButton text={command} />
      </div>
      <h3>Что он проверит</h3>
      <ul className="mentor-checklist">
        {day.mentor.checklist.map((c) => (
          <li key={c.id}>
            {c.text}
            {c.auto && <span className="badge">{AUTO_LABEL[c.auto]}</span>}
          </li>
        ))}
      </ul>
      {day.mentor.questions.length > 0 && (
        <>
          <h3>О чём спросит</h3>
          <ul className="mentor-questions">
            {day.mentor.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </>
      )}
      <label className={`mentor-accept${accepted ? ' is-on' : ''}`}>
        <input type="checkbox" checked={accepted} onChange={(e) => update((p) => setMentorAccepted(p, day.id, e.target.checked))} />
        Наставник принял день
      </label>
    </div>
  )
}
