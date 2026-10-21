import { Player, type PlayerRef } from '@remotion/player'
import { useEffect, useRef, useState } from 'react'
import { totalFrames } from '../../video/lib/timeline'
import { HotspotLayer } from './HotspotLayer'
import { videos } from './registry'
import { useNarration, useRussianVoice } from './useNarration'

function clock(frame: number, fps: number): string {
  const s = Math.floor(frame / fps)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Объясняющий ролик на странице: свой пульт, голос браузера, зоны с пояснениями на паузе.
export function VideoBlock({ videoId, title }: { videoId: string; title: string }) {
  const entry = videos[videoId]
  const playerRef = useRef<PlayerRef>(null)
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const voice = useRussianVoice()
  const [voiceOn, setVoiceOn] = useState(true)
  useNarration(playerRef, entry?.script.cues ?? [], voice, voiceOn && playing)

  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    const onFrame = ({ detail }: { detail: { frame: number } }) => setFrame(detail.frame)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    p.addEventListener('frameupdate', onFrame)
    p.addEventListener('seeked', onFrame)
    p.addEventListener('play', onPlay)
    p.addEventListener('pause', onPause)
    p.addEventListener('ended', onPause)
    return () => {
      p.removeEventListener('frameupdate', onFrame)
      p.removeEventListener('seeked', onFrame)
      p.removeEventListener('play', onPlay)
      p.removeEventListener('pause', onPause)
      p.removeEventListener('ended', onPause)
    }
  }, [entry])

  if (!entry) {
    return (
      <div className="block block-soon">
        <p className="block-soon-title">{title}</p>
        <p className="soon">Ролик готовится</p>
      </div>
    )
  }

  const { script, component, mp4Url } = entry
  const duration = totalFrames(script)
  return (
    <figure className="block video">
      <figcaption className="video-title">{title}</figcaption>
      <div className="video-stage">
        <Player
          ref={playerRef}
          component={component}
          durationInFrames={duration}
          compositionWidth={script.width}
          compositionHeight={script.height}
          fps={script.fps}
          style={{ width: '100%', aspectRatio: '16 / 9' }}
          clickToPlay={false}
          spaceKeyToPlayOrPause={false}
          acknowledgeRemotionLicense
        />
        {!playing && <HotspotLayer key={frame} hotspots={script.hotspots} frame={frame} />}
      </div>
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
      {mp4Url && (
        <a className="video-download" href={mp4Url} download>
          Скачать MP4
        </a>
      )}
    </figure>
  )
}
