const STEPS: { title: string; text: string }[] = [
  { title: 'Видеоурок', text: 'короткий ролик с пояснениями по нажатию' },
  { title: 'Теория и тест', text: 'мысли из книги, схемы, тренажёры и проверка понимания' },
  { title: 'Практика в Claude Code', text: 'готовые запросы: копируете и делаете шаг за шагом' },
  { title: 'Наставник проверяет', text: 'команда /mentor сверяет сделанное в вашем проекте' },
]

// «Как проходит день» — тёмный блок терминала с четырьмя шагами по порядку; сюда ведёт «Как устроен курс».
// «# » перед заголовком — комментарий, как в терминале (для чтения с экрана пустой)
export function DaySteps() {
  return (
    <section id="how" className="how" aria-labelledby="how-title">
      <h2 id="how-title" className="how-title">
        Как проходит день
      </h2>
      <ol className="how-steps">
        {STEPS.map((step) => (
          <li key={step.title} className="how-step">
            <h3 className="how-step-title">{step.title}</h3>
            <p className="how-step-text">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
