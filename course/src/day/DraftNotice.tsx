import { Agent } from '../components/illustrations'
import { PART_TITLES, type PartId } from '../course/dayParts'

// «тест», «тест и практика», «тест, практика и наставник»
function listOf(words: string[]): string {
  return words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} и ${words[words.length - 1]}`
}

// Черновой день: одна карточка вместо «Скоро» в каждой части — называет только недостающее.
// Агент светлый, поэтому стоит на синей плашке: на бумаге его не видно.
export function DraftNotice({ missing }: { missing: PartId[] }) {
  const names = missing.map((id) => PART_TITLES[id].toLowerCase())
  return (
    <div className="paper draft-notice">
      <span className="draft-agent" aria-hidden="true">
        <Agent size={56} />
      </span>
      <p className="draft-text">{`Остальное готовится: ${listOf(names)} ${names.length === 1 ? 'появится' : 'появятся'} позже.`}</p>
    </div>
  )
}
