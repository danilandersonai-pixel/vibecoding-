import { Player, type PlayerRef } from '@remotion/player'
import { useEffect, useId, useRef, useState } from 'react'
import { totalFrames } from '../../video/lib/timeline'
import { getClaude, type DownloadsLike } from '../claude'
import { saveVideo } from './download'
import { HotspotLayer } from './HotspotLayer'
import { videos } from './registry'
import { useNarration, useRussianVoice } from './useNarration'

// Запуск ролика сообщает всем блокам страницы; остальные встают на паузу, чтобы голоса не накладывались.
const PLAY_EVENT = 'vibecourse:video-play'
type PlayDetail = { videoId: string; instance: string }

// Показывается внутри кадра (масштабируется вместе с ним), поэтому крупный шрифт задан в .video-failed.
const loadFailed = () => (
  <p className="video-failed" role="alert">
    Ролик не загрузился
  </p>
)

function clock(frame: number, fps: number): string {
  const s = Math.floor(frame / fps)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Другой ролик на том же месте страницы (переход между днями) — состояние плеера начинается заново.
export function VideoBlock(props: { videoId: string; title: string }) {
  return <VideoBlockBody key={props.videoId} {...props} />
}

// Объясняющий ролик на странице: свой пульт, голос браузера, зоны с пояснениями на паузе.
function VideoBlockBody({ videoId, title }: { videoId: string; title: string }) {
  const entry = videos[videoId]
  const playerRef = useRef<PlayerRef>(null)
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const voice = useRussianVoice()
  const [voiceOn, setVoiceOn] = useState(true)
  const [downloads, setDownloads] = useState<DownloadsLike | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const instance = useId()
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

  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    const onFrame = ({ detail }: { detail: { frame: number } }) => setFrame(detail.frame)
    const onPlay = () => {
      setPlaying(true)
      window.dispatchEvent(new CustomEvent<PlayDetail>(PLAY_EVENT, { detail: { videoId, instance } }))
    }
    const onPause = () => setPlaying(false)
    const onError = () => setFailed(true)
    p.addEventListener('frameupdate', onFrame)
    p.addEventListener('seeked', onFrame)
    p.addEventListener('play', onPlay)
    p.addEventListener('pause', onPause)
    p.addEventListener('ended', onPause)
    p.addEventListener('error', onError)
    return () => {
      p.removeEventListener('frameupdate', onFrame)
      p.removeEventListener('seeked', onFrame)
      p.removeEventListener('play', onPlay)
      p.removeEventListener('pause', onPause)
      p.removeEventListener('ended', onPause)
      p.removeEventListener('error', onError)
    }
  }, [entry, videoId, instance])

  if (!entry) {
    return (
      <div className="block block-soon">
        <p className="block-soon-title">{title}</p>
        <p className="soon">Ролик готовится</p>
      </div>
    )
  }

  const { script, load, mp4Url } = entry
  const duration = totalFrames(script)
  return (
    <figure className="block video">
      <figcaption className="video-title">{title}</figcaption>
      <div className="video-stage">
        <Player
          ref={playerRef}
          lazyComponent={load}
          errorFallback={loadFailed}
          durationInFrames={duration}
          compositionWidth={script.width}
          compositionHeight={script.height}
          fps={script.fps}
          style={{ width: '100%', aspectRatio: '16 / 9' }}
          clickToPlay={false}
          spaceKeyToPlayOrPause={false}
          acknowledgeRemotionLicense
        />
        {!playing && !failed && <HotspotLayer key={frame} hotspots={script.hotspots} frame={frame} />}
      </div>
      {!failed && (
        <>
          <div className="video-controls">
            <button type="button" className="btn" onClick={() => playerRef.current?.toggle()}>
              {playing ? 'Пауза' : 'Смотреть'}
            </button>
            <input
              type="range"
              aria-label="Перемотка"
              min={0}
              max={duration - 1}
              value={frame}
              onChange={(e) => {
                const f = Number(e.target.value)
                playerRef.current?.seekTo(f)
                setFrame(f)
              }}
            />
            <span className="video-time" data-testid="video-time">
              {clock(frame, script.fps)} / {clock(duration, script.fps)}
            </span>
            {voice && (
              <label className="video-voice">
                <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} />
                Голос
              </label>
            )}
          </div>
          {!playing && script.hotspots.some((h) => frame >= h.from && frame < h.to) && <p className="video-hint">На паузе можно нажать на подсвеченную часть кадра.</p>}
        </>
      )}
      {mp4Url && downloads && (
        <p className="video-download">
          <button
            type="button"
            className="btn"
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
