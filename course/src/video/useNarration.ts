import type { PlayerRef } from '@remotion/player'
import { useEffect, useState, type RefObject } from 'react'
import type { Cue } from '../../video/types'
import { cueStarting, pickRussianVoice, spokenText } from './narration'

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
}

// Русский голос браузера; null — синтеза нет или русского голоса нет (тогда только субтитры).
export function useRussianVoice(): SpeechSynthesisVoice | null {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(() => {
    const s = synth()
    return s ? pickRussianVoice(s.getVoices()) : null
  })
  useEffect(() => {
    const s = synth()
    if (!s) return
    const update = () => setVoice(pickRussianVoice(s.getVoices()))
    s.addEventListener('voiceschanged', update)
    return () => s.removeEventListener('voiceschanged', update)
  }, [])
  return voice
}

// Озвучивает реплику, когда воспроизведение доходит до её начала; пауза и перемотка обрывают речь.
export function useNarration(playerRef: RefObject<PlayerRef | null>, cues: Cue[], voice: SpeechSynthesisVoice | null, enabled: boolean) {
  useEffect(() => {
    const player = playerRef.current
    const s = synth()
    if (!player || !s || !voice || !enabled) return
    let prev = player.getCurrentFrame()
    const onFrame = ({ detail }: { detail: { frame: number } }) => {
      const cue = cueStarting(prev, detail.frame, cues)
      prev = detail.frame
      if (!cue) return
      s.cancel()
      const u = new SpeechSynthesisUtterance(spokenText(cue.text))
      u.voice = voice
      u.lang = 'ru-RU'
      u.rate = 1.05
      s.speak(u)
    }
    const stop = () => s.cancel()
    const onSeek = ({ detail }: { detail: { frame: number } }) => {
      prev = detail.frame
      s.cancel()
    }
    player.addEventListener('frameupdate', onFrame)
    player.addEventListener('pause', stop)
    player.addEventListener('seeked', onSeek)
    return () => {
      player.removeEventListener('frameupdate', onFrame)
      player.removeEventListener('pause', stop)
      player.removeEventListener('seeked', onSeek)
      s.cancel()
    }
  }, [playerRef, cues, voice, enabled])
}
