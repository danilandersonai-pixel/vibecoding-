import { useCourseProgress } from '../progress/courseProgress'
import { setNotes } from '../progress/model'

// Заметки дня — поле на «бумаге»; текст сохраняется в прогрессе
export function Notes({ dayId }: { dayId: string }) {
  const { progress, update } = useCourseProgress()
  return (
    <label className="notes">
      <span className="notes-title">Заметки дня</span>
      <textarea
        rows={4}
        value={progress.days[dayId]?.notes ?? ''}
        placeholder="Что понял, что осталось непонятным, что спросить у наставника"
        onChange={(e) => {
          const value = e.target.value
          update((p) => setNotes(p, dayId, value))
        }}
      />
    </label>
  )
}
