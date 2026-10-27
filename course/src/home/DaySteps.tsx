import { typeLine, useReveal } from '../motion'

const STEPS: { title: string; text: string }[] = [
  { title: 'Видеоурок', text: 'короткий ролик с пояснениями по нажатию' },
  { title: 'Теория и тест', text: 'мысли из книги, схемы, тренажёры и проверка понимания' },
  { title: 'Практика в Claude Code', text: 'готовые запросы: копируете и делаете шаг за шагом' },
  { title: 'Наставник проверяет', text: 'команда /mentor сверяет сделанное в вашем проекте' },
]

// «Как проходит день» — тёмный блок терминала с четырьмя шагами по порядку; сюда ведёт «Как устроен курс».
// «# » перед заголовком — комментарий, как в терминале (для чтения с экрана пустой).
// При первом показе строки печатаются по очереди, в конце мигает курсор (useReveal); текст в разметке сразу
export function DaySteps() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} id="how" className="how" aria-labelledby="how-title">
      <h2 id="how-title" className="how-title type-line" style={typeLine(0, 19)}>
        Как проходит день
      </h2>
      <ol className="how-steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className="how-step type-line" style={typeLine(i + 1, Math.max(step.title.length, step.text.length) + 3)}>
            <h3 className="how-step-title">{step.title}</h3>
            <p className="how-step-text">
              {step.text}
              {i === STEPS.length - 1 && <span className="term-cursor" aria-hidden="true" />}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
