import { IconPlay } from '../components/icons'

// Обложка до первого запуска: лежит на кадре обложки ролика, снизу затемнение, по центру ▶.
// Вся обложка — одна кнопка, нажатие в любом месте запускает ролик с начала.
export function VideoCover({ title, label, duration, onPlay }: { title: string; label: string; duration: string; onPlay(): void }) {
  return (
    <button type="button" className="video-cover" aria-label={`Смотреть ролик «${title}»`} onClick={onPlay}>
      <span className="video-cover-play">
        <IconPlay size={30} />
      </span>
      <span className="video-cover-label">{label}</span>
      <span className="video-cover-time">{duration}</span>
    </button>
  )
}
