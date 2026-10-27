import { useEffect, useRef, useState } from 'react'

// Копирует текст; если буфер обмена недоступен — показывает поле с выделенным текстом.
// tone — цвета блока, где стоит кнопка: тёмный блок терминала (запрос, команда наставника)
export function CopyButton({ text, tone = 'term' }: { text: string; tone?: 'term' }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const field = useRef<HTMLTextAreaElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (state === 'manual') field.current?.select()
  }, [state])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('manual')
    }
  }

  return (
    <span className={`copy copy-${tone}`}>
      <button type="button" className={`btn copy-btn copy-btn-${tone}`} onClick={() => void copy()}>
        {/* key — новая подпись въезжает снизу (blocks.css, .copy-label); первая подпись стоит на месте */}
        {state === 'copied' ? (
          <span key="copied" className="copy-label">
            Скопировано
          </span>
        ) : (
          <span key="idle">Скопировать</span>
        )}
      </button>
      {state === 'manual' && (
        <span className="copy-manual">
          <span className="copy-hint">Скопируйте вручную</span>
          <textarea ref={field} readOnly value={text} rows={Math.min(8, text.split('\n').length + 1)} onFocus={(e) => e.target.select()} />
        </span>
      )}
    </span>
  )
}
