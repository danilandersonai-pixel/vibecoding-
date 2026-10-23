import type { ReactNode } from 'react'
import { IconBook, IconCheck, IconSteps, IconVideo } from '../components/icons'

const STEPS: { title: string; text: string; icon: ReactNode }[] = [
  { title: 'Видеоурок', text: 'короткий ролик с пояснениями по нажатию', icon: <IconVideo size={22} /> },
  { title: 'Теория и тест', text: 'мысли из книги, схемы, тренажёры и проверка понимания', icon: <IconBook size={22} /> },
  { title: 'Практика в Claude Code', text: 'готовые запросы: копируете и делаете шаг за шагом', icon: <IconSteps size={22} /> },
  { title: 'Наставник проверяет', text: 'команда /mentor сверяет сделанное в вашем проекте', icon: <IconCheck size={22} /> },
]

// «Как проходит день» — четыре шага в ряд, на телефоне столбиком; сюда ведёт «Как устроен курс»
export function DaySteps() {
  return (
    <section id="how" className="how" aria-labelledby="how-title">
      <h2 id="how-title" className="how-title">
        Как проходит день
      </h2>
      <ol className="how-steps">
        {STEPS.map((step) => (
          <li key={step.title} className="how-step">
            <span className="how-icon">{step.icon}</span>
            <h3 className="how-step-title">{step.title}</h3>
            <p className="how-step-text">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
