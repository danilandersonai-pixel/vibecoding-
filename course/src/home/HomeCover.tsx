import { RouteLink } from '../components/RouteLink'
import type { CoverCta } from './cta'
import { DaySteps } from './DaySteps'
import { scrollToId } from './scroll'

// Вводный блок главной: заголовок курса, что в нём будет, главная кнопка (в текущий день) и «Как устроен курс»;
// справа — терминальная справка «Как проходит день»
export function HomeCover({ cta }: { cta: CoverCta }) {
  return (
    <section className="intro" aria-labelledby="intro-title">
      <div className="intro-text">
        <h1 id="intro-title" className="intro-title">
          Своё приложение с&nbsp;ИИ за&nbsp;21&nbsp;день
        </h1>
        <p className="intro-lead">
          Каждый день — короткая теория, видеоурок и практика в Claude Code. К концу курса у вас работает приложение для тренера и его подопечных.
        </p>
        <div className="intro-actions">
          {'to' in cta ? (
            <RouteLink to={cta.to} className="btn btn-primary intro-btn">
              {cta.label}
            </RouteLink>
          ) : (
            <button type="button" className="btn btn-primary intro-btn" onClick={() => scrollToId(cta.scrollTo)}>
              {cta.label}
            </button>
          )}
          <button type="button" className="btn intro-btn" onClick={() => scrollToId('how')}>
            Как устроен курс
          </button>
        </div>
      </div>
      <DaySteps />
    </section>
  )
}
