import { PART_TITLES, type PartId } from '../course/dayParts'

// «тест», «тест и практика», «тест, практика и наставник»
function listOf(words: string[]): string {
  return words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} и ${words[words.length - 1]}`
}

// Черновой день: одна строка в пунктирной рамке вместо «Скоро» в каждой части — называет только недостающее.
// Пунктир в курсе значит «готовится»
export function DraftNotice({ missing }: { missing: PartId[] }) {
  const names = missing.map((id) => PART_TITLES[id].toLowerCase())
  return (
    <div className="draft-notice">
      <p className="draft-text">{`Остальное готовится: ${listOf(names)} ${names.length === 1 ? 'появится' : 'появятся'} позже.`}</p>
    </div>
  )
}
