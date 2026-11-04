import type { CSSProperties } from 'react'
import type { VideoChapter } from '../../video/types'
import { IconExpand, IconPause, IconPlay } from '../components/icons'
import { chapterIndexAt, clock } from './chapters'

type Props = {
  playing: boolean
  ended?: boolean // ролик досмотрен: текущее время — полная длительность, а не 4:19 из 4:20
  frame: number
  frames: number // кадров в ролике
  duration: string // полная длительность «м:сс» — та же, что на обложке и в шапке дня
  fps: number
  chapters?: VideoChapter[] // главы ролика: сегменты под перемоткой и подпись текущей главы; нет — панель как у роликов без глав
  voice: boolean // в браузере есть русский голос
  voiceOn: boolean
  onToggle(): void
  onSeek(frame: number): void
  onVoice(on: boolean): void
  fullscreen?: boolean
  onFullscreen?: () => void // нет — браузер не умеет полноэкранный режим, кнопки нет
}

// Панель под кадром: перемотка сверху, под ней ▶/⏸, время, глава, «Голос» и «Во весь экран»
export function VideoControls({ playing, ended = false, frame, frames, duration, fps, chapters = [], voice, voiceOn, onToggle, onSeek, onVoice, fullscreen = false, onFullscreen }: Props) {
  const current = chapterIndexAt(chapters, frame)
  const seek = (
    <input
      type="range"
      className="video-seek"
      aria-label="Перемотка"
      min={0}
      max={frames - 1}
      value={frame}
      onChange={(e) => onSeek(Number(e.target.value))}
    />
  )
  return (
    <div className="video-controls">
      {current < 0 ? (
        seek
      ) : (
        <div className="video-seek-wrap">
          {/* Полоса для глаз под ползунком: ширина сегмента — длина главы в кадрах (зазор между ними задаёт стиль), --fill — пройденная доля.
              Ползунок остаётся единственным управляемым элементом, поэтому полоса скрыта от чтения с экрана */}
          <div className="video-seek-chapters" aria-hidden="true">
            {chapters.map((c, i) => {
              const length = (chapters[i + 1]?.from ?? frames) - c.from
              const done = ended ? 1 : Math.min(1, Math.max(0, (frame - c.from) / length))
              return <span key={c.from} className="video-seek-chapter" style={{ flexGrow: length, '--fill': `${done * 100}%` } as CSSProperties} />
            })}
          </div>
          {seek}
        </div>
      )}
      <button type="button" className="btn video-toggle" aria-label={playing ? 'Пауза' : 'Смотреть'} onClick={onToggle}>
        {playing ? <IconPause size={20} /> : <IconPlay size={20} />}
      </button>
      <span className="video-time" data-testid="video-time">
        {ended ? duration : clock(frame, fps)} / {duration}
      </span>
      {current >= 0 && (
        <span className="video-chapter" data-testid="video-chapter">
          {`${current + 1}/${chapters.length} · ${chapters[current].title}`}
        </span>
      )}
      {voice && (
        <label className="video-voice">
          <input type="checkbox" checked={voiceOn} onChange={(e) => onVoice(e.target.checked)} />
          Голос
        </label>
      )}
      {onFullscreen && (
        <button
          type="button"
          className="btn video-fullscreen"
          aria-label={fullscreen ? 'Выйти из полноэкранного режима' : 'Во весь экран'}
          onClick={onFullscreen}
        >
          <IconExpand size={20} />
        </button>
      )}
    </div>
  )
}
