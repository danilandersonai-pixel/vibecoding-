import { Fragment } from 'react'
import { Agent, Coach, Student } from '../components/illustrations'
import { IconArrow } from '../components/icons'
import { RouteLink } from '../components/RouteLink'
import { plural } from '../course/summary'
import { videos } from '../video/registry'
import type { CoverCta } from './cta'
import { scrollToId } from './scroll'
import { SiteBar } from './SiteBar'

// Диф «было / стало», как на обложке книги
const DIFF = [
  { kind: 'head', text: '@@ 21 день @@' },
  { kind: 'del', text: '- «сделай мне приложение» и надежда' },
  { kind: 'del', text: '- код, который никто не читал' },
  { kind: 'add', text: '+ спецификация, план, маленькие шаги' },
  { kind: 'add', text: '+ тесты, защита данных, запуск' },
]

const videoCount = Object.keys(videos).length
const FACTS = [
  '21 день · 3 недели',
  `${videoCount} ${plural(videoCount, 'видеоурок', 'видеоурока', 'видеоуроков')}`,
  'Практика в Claude Code',
  'Наставник в Claude Code',
]

// Обложка главной во всю ширину: что за курс, куда нажать, герои роликов и диф
export function HomeCover({ cta }: { cta: CoverCta }) {
  return (
    <header className="cover">
      <div className="home-wrap cover-inner">
        <SiteBar />
        <div className="cover-main">
          <div className="cover-text">
            <p className="kicker cover-kicker">Практический курс · по книге «Вайб-кодинг на практике»</p>
            <h1 className="cover-title">Своё приложение с ИИ за 21 день</h1>
            <p className="cover-lead">
              Каждый день — короткая теория, видеоурок и практика в Claude Code. К концу курса у вас работает приложение для тренера и его подопечных.
            </p>
            <div className="cover-actions">
              {'to' in cta ? (
                <RouteLink to={cta.to} className="btn btn-cover cover-btn">
                  {cta.label}
                  <IconArrow />
                </RouteLink>
              ) : (
                <button type="button" className="btn btn-cover cover-btn" onClick={() => scrollToId(cta.scrollTo)}>
                  {cta.label}
                  <IconArrow />
                </button>
              )}
              <button type="button" className="btn btn-ghost cover-btn cover-how" onClick={() => scrollToId('how')}>
                Как устроен курс
              </button>
            </div>
          </div>
          <div className="cover-art">
            <div className="cover-heroes" aria-hidden="true">
              <Coach size={120} />
              <Student size={104} />
              <Agent size={112} />
            </div>
            <pre className="cover-diff">
              {DIFF.map((line, i) => (
                <Fragment key={line.text}>
                  {i > 0 && '\n'}
                  <span className={`diff-${line.kind}`}>{line.text}</span>
                </Fragment>
              ))}
            </pre>
          </div>
        </div>
        <ul className="cover-facts">
          {FACTS.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
    </header>
  )
}
