const svgs = import.meta.glob(['../../content/figures/*.svg', '!**/_defs.svg'], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

const byId = new Map(Object.entries(svgs).map(([path, svg]) => [path.slice(path.lastIndexOf('/') + 1, -'.svg'.length), svg]))

// Схема из книги по её id; SVG доверенный — он сгенерирован из нашей же книги.
export function Figure({ id }: { id: string }) {
  const svg = byId.get(id)
  if (!svg) return <div className="figure figure-missing">Схема не найдена</div>
  return <div className="figure" dangerouslySetInnerHTML={{ __html: svg }} />
}
