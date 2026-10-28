import { Player, type PlayerRef } from '@remotion/player'
import { useEffect, useId, useRef, useState } from 'react'
import { SubtitlesShown } from '../../video/lib/subtitlesShown'
import { totalFrames } from '../../video/lib/timeline'
import { getClaude, type DownloadsLike } from '../claude'
import { IconArrow, IconPlay } from '../components/icons'
import { formatDuration, plural, videoMeta } from '../course/summary'
import { scrollToElement } from '../home/scroll'
import { chapterIndexAt, clock } from './chapters'
import { saveVideo } from './download'
import { HotspotLayer } from './HotspotLayer'
import { videos } from './registry'
import { isTermScript } from './termScript'
import { useNarration, useRussianVoice } from './useNarration'
import { VideoControls } from './VideoControls'
import { VideoCover } from './VideoCover'

// Запуск ролика сообщает всем блокам страницы; остальные встают на паузу, чтобы голоса не накладывались.
const PLAY_EVENT = 'vibecourse:video-play'
type PlayDetail = { videoId: string; instance: string }

// Показывается внутри кадра (масштабируется вместе с ним), поэтому крупный шрифт задан в .video-failed;
// кадр 1920 × 1080 сжимается сильнее 1280 × 720, ему шрифт ещё крупнее (.video-failed-wide).
const loadFailed = (dark: boolean) => (
  <p className={dark ? 'video-failed video-failed-wide' : 'video-failed'} role="alert">
    Ролик не загрузился
  </p>
)

// «Дальше» в конце ролика: следующий ролик сетки или блок теории, а за последним — следующая часть дня
function nextMaterial(el: Element): Element | null {
  for (let at: Element | null = el; at && at !== document.body; at = at.parentElement) {
    if (at.nextElementSibling) return at.nextElementSibling
  }
  return null
}

type Props = { videoId: string; title: string; index?: number }

// Другой ролик на том же месте страницы (переход между днями) — состояние плеера начинается заново.
export function VideoBlock(props: Props) {
  return <VideoBlockBody key={props.videoId} {...props} />
}

// Объясняющий ролик на странице: обложка до первого запуска, своя панель, голос браузера, главы (полоса перемотки и список),
// зоны с пояснениями на паузе и экран «Смотреть ещё раз / Дальше» в конце.
// index — номер ролика среди роликов дня («Видеоурок i» на обложке).
function VideoBlockBody({ videoId, title, index }: Props) {
  const entry = videos[videoId]
  const meta = videoMeta(videoId)
  const playerRef = useRef<PlayerRef>(null)
  const figureRef = useRef<HTMLElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  // Плеер стоит на кадре обложки, пока ролик ни разу не запускали (started)
  const [frame, setFrame] = useState(meta?.posterFrame ?? 0)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const voice = useRussianVoice()
  const [voiceOn, setVoiceOn] = useState(true)
  const [downloads, setDownloads] = useState<DownloadsLike | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const instance = useId()
  const titleId = useId()
  const mp4 = entry?.mp4Url
  useNarration(playerRef, entry?.script.cues ?? [], voice, voiceOn && playing)

  useEffect(() => {
    const claude = getClaude()
    if (!mp4 || !claude) return
    let alive = true
    claude
      .use('downloads')
      .then((d) => alive && setDownloads(d as DownloadsLike | null))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [mp4])

  useEffect(() => {
    const onOtherPlay = (e: Event) => {
      const from = (e as CustomEvent<PlayDetail | undefined>).detail
      if (from?.instance !== instance) playerRef.current?.pause()
    }
    window.addEventListener(PLAY_EVENT, onOtherPlay)
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay)
  }, [instance])

  // Во весь экран уходит блок с кадром и панелью; выйти можно и по Esc — тогда браузер сообщает об этом сам
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement != null && document.fullscreenElement === screenRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    const onFrame = ({ detail }: { detail: { frame: number } }) => setFrame(detail.frame)
    const onPlay = () => {
      setStarted(true)
      setPlaying(true)
      setEnded(false)
      window.dispatchEvent(new CustomEvent<PlayDetail>(PLAY_EVENT, { detail: { videoId, instance } }))
    }
    const onPause = () => setPlaying(false)
    const onEnded = () => {
      setStarted(true)
      setPlaying(false)
      setEnded(true)
    }
    const onError = () => setFailed(true)
    p.addEventListener('frameupdate', onFrame)
    p.addEventListener('seeked', onFrame)
    p.addEventListener('play', onPlay)
    p.addEventListener('pause', onPause)
    p.addEventListener('ended', onEnded)
    p.addEventListener('error', onError)
    return () => {
      p.removeEventListener('frameupdate', onFrame)
      p.removeEventListener('seeked', onFrame)
      p.removeEventListener('play', onPlay)
      p.removeEventListener('pause', onPause)
      p.removeEventListener('ended', onEnded)
      p.removeEventListener('error', onError)
    }
  }, [entry, videoId, instance])

  if (!entry || !meta) {
    return (
      <div className="block block-soon">
        <p className="block-soon-title">{title}</p>
        <p className="soon">Ролик готовится</p>
      </div>
    )
  }

  // Запуск с обложки и «Смотреть ещё раз» — всегда с начала
  const start = () => {
    const p = playerRef.current
    if (!p) return
    setStarted(true)
    setEnded(false)
    setFrame(0)
    p.seekTo(0)
    p.play()
  }
  // Перемотка до самого конца плеер сам считает концом ролика (событие ended) — тогда появится экран конца
  const seek = (f: number) => {
    setStarted(true)
    setEnded(false)
    setFrame(f)
    playerRef.current?.seekTo(f)
  }
  // Глава из списка: с обложки, с паузы и после конца ролик запускается с начала главы, идущий — продолжает с неё.
  // Сначала pause(): seekTo идущего плеера сам ставит на паузу «до возобновления» и потом запускает его, а наш play() сразу следом
  // оставил бы эту отметку висеть — и следующее нажатие «Пауза» тут же отменялось бы. Речь после перемотки не накладывается:
  // её обрывают pause и seeked (useNarration)
  const startChapter = (from: number) => {
    const p = playerRef.current
    if (!p) return
    setStarted(true)
    setEnded(false)
    setFrame(from)
    p.pause()
    p.seekTo(from)
    p.play()
  }
  // «Дальше» во весь экран: сначала выйти из него, иначе прокрутится документ под полноэкранным блоком
  const goNext = () => {
    const figure = figureRef.current
    if (!figure) return
    const go = () => scrollToElement(nextMaterial(figure))
    if (document.fullscreenElement != null && document.fullscreenElement === screenRef.current) document.exitFullscreen().then(go, go)
    else go()
  }
  const toggleFullscreen = () => {
    const el = screenRef.current
    if (!el) return
    if (document.fullscreenElement === el) document.exitFullscreen().catch(() => undefined)
    else el.requestFullscreen().catch(() => undefined)
  }

  const { script, load, mp4Url } = entry
  const dark = isTermScript(script)
  const frames = totalFrames(script)
  const duration = formatDuration(meta.seconds)
  const shownFrame = started ? frame : 0
  const paused = started && !playing && !ended
  const spots = meta.hotspots
  // Главы есть не у старых роликов; пустой список — всё равно что нет
  const chapters = script.chapters?.length ? script.chapters : undefined
  const currentChapter = chapters ? chapterIndexAt(chapters, shownFrame) : -1
  return (
    <figure ref={figureRef} className="block video" aria-labelledby={titleId}>
      <div ref={screenRef} className="video-screen">
        <div className={dark ? 'video-stage is-dark' : 'video-stage'}>
          {/* Пока ролик стоит на обложке, субтитры кадра обложки не рисуются: под нижним затемнением они только шумят */}
          <SubtitlesShown.Provider value={started}>
            {/* Класс video-frame стилей не имеет — это крючок e2e (кадр ролика нарисован), не удалять */}
            <Player
              ref={playerRef}
              className="video-frame"
              lazyComponent={load}
              errorFallback={() => loadFailed(dark)}
              durationInFrames={frames}
              compositionWidth={script.width}
              compositionHeight={script.height}
              fps={script.fps}
              initialFrame={meta.posterFrame}
              style={{ width: '100%', aspectRatio: '16 / 9' }}
              clickToPlay={false}
              spaceKeyToPlayOrPause={false}
              acknowledgeRemotionLicense
            />
          </SubtitlesShown.Provider>
          {!failed && !started && <VideoCover title={title} label={index ? `Видеоурок ${index}` : 'Видеоурок'} duration={duration} onPlay={start} />}
          {!failed && paused && <HotspotLayer key={frame} hotspots={script.hotspots} width={script.width} height={script.height} frame={frame} />}
          {!failed && ended && (
            <div className="video-end">
              <button type="button" className="btn btn-cover" onClick={start}>
                <IconPlay size={18} /> Смотреть ещё раз
              </button>
              <button type="button" className="btn video-end-next" onClick={goNext}>
                Дальше <IconArrow size={18} />
              </button>
            </div>
          )}
        </div>
        {!failed && (
          <VideoControls
            playing={playing}
            ended={ended}
            frame={shownFrame}
            frames={frames}
            duration={duration}
            fps={script.fps}
            chapters={chapters}
            voice={voice !== null}
            voiceOn={voiceOn}
            onToggle={() => (!started || ended ? start() : playerRef.current?.toggle())}
            onSeek={seek}
            onVoice={setVoiceOn}
            fullscreen={fullscreen}
            onFullscreen={document.fullscreenEnabled ? toggleFullscreen : undefined}
          />
        )}
        {!failed && paused && script.hotspots.some((h) => frame >= h.from && frame < h.to) && (
          <p className="video-hint">Нажмите на подсвеченное, чтобы узнать подробнее</p>
        )}
      </div>
      <h3 id={titleId} className="video-title">
        {title}
      </h3>
      <p className="video-meta">{spots > 0 ? `${duration} · ${spots} ${plural(spots, 'пояснение', 'пояснения', 'пояснений')} по нажатию` : duration}</p>
      {chapters && !failed && (
        <ol className="video-chapters" aria-label="Главы ролика">
          {chapters.map((c, i) => (
            <li key={c.from}>
              <button type="button" aria-current={i === currentChapter ? 'true' : undefined} onClick={() => startChapter(c.from)}>
                <span className="video-chapter-time">{clock(c.from, script.fps)}</span> <span className="video-chapter-title">{c.title}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {mp4Url && downloads && (
        <p className="video-download">
          <button
            type="button"
            className="btn video-download-btn"
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              setSaveError(await saveVideo(mp4Url, `${videoId}.mp4`, downloads))
              setSaving(false)
            }}
          >
            Скачать MP4
          </button>
          {saveError && <span className="ai-error"> {saveError}</span>}
        </p>
      )}
    </figure>
  )
}
