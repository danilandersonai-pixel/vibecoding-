import defs from '../../content/figures/_defs.svg?raw'

// Маркеры стрелок, на которые ссылаются схемы книги; монтируется один раз в App.
export function FigureDefs() {
  return <div hidden dangerouslySetInnerHTML={{ __html: defs }} />
}
