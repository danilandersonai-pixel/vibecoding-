import { IconExpand, IconPause, IconPlay } from '../components/icons'

// Текущее время — целые секунды, прошедшие с начала
function clock(frame: number, fps: number): string {
  const s = Math.floor(frame / fps)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type Props = {
  playing: boolean
  frame: number
  frames: number // кадров в ролике
  duration: string // полная длительность «м:сс» — та же, что на обложке и в шапке дня
  fps: number
  voice: boolean // в браузере есть русский голос
  voiceOn: boolean
  onToggle(): void
  onSeek(frame: number): void
  onVoice(on: boolean): void
  fullscreen?: boolean
  onFullscreen?: () => void // нет — браузер не умеет полноэкранный режим, кнопки нет
}

// Панель под кадром: перемотка сверху, под ней ▶/⏸, время, «Голос» и «Во весь экран»
export function VideoControls({ playing, frame, frames, duration, fps, voice, voiceOn, onToggle, onSeek, onVoice, fullscreen = false, onFullscreen }: Props) {
  return (
    <div className="video-controls">
      <input
        type="range"
        className="video-seek"
        aria-label="Перемотка"
        min={0}
        max={frames - 1}
        value={frame}
        onChange={(e) => onSeek(Number(e.target.value))}
      />
      <button type="button" className="btn video-toggle" aria-label={playing ? 'Пауза' : 'Смотреть'} onClick={onToggle}>
        {playing ? <IconPause size={20} /> : <IconPlay size={20} />}
      </button>
      <span className="video-time" data-testid="video-time">
        {clock(frame, fps)} / {duration}
      </span>
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
