import defs from '../../content/figures/_defs.svg?raw'

// Маркеры стрелок, на которые ссылаются схемы книги; монтируется один раз в App.
// Обёртка невидима, но не скрыта: из display:none (атрибут hidden) Chromium маркеры не рисует.
export function FigureDefs() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      dangerouslySetInnerHTML={{ __html: defs }}
    />
  )
}
