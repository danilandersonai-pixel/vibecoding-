import type { Cue } from '../../video/types'

const MAX_STEP = 15

// Реплика, чьё начало пересекли при обычном воспроизведении. Перемотка и скачки — молчание.
export function cueStarting(prevFrame: number, frame: number, cues: Cue[]): Cue | null {
  if (frame <= prevFrame || frame - prevFrame > MAX_STEP) return null
  return cues.find((c) => c.from > prevFrame && c.from <= frame) ?? null
}

export function pickRussianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ?? null
}

// Как голосу браузера читать латиницу и знаки из реплик. Субтитры остаются как написано.
// Порядок важен: длинные сочетания раньше коротких. Новое латинское слово в реплике — новая строка здесь
// (тест в narration.test.ts не пропустит реплику с латиницей без произношения).
const SAY: [RegExp, string][] = [
  [/client\/(\d+)/g, 'клиент $1'],
  [/CLAUDE\.md/g, 'клод эм-дэ'],
  [/\bClaude Design\b/g, 'Клод Дизайн'],
  [/\bClaude Code\b/g, 'Клод Код'],
  [/\bClaude\b/g, 'Клод'],
  [/\/clear\b/g, 'клир'],
  [/\/compact\b/g, 'компакт'],
  [/\/context\b/g, 'контекст'],
  [/\/usage\b/g, 'юсадж'],
  [/\bnpm run dev\b/g, 'эн-пи-эм ран дев'],
  [/\.env\b/g, 'точка энв'],
  [/\bGitHub\b/g, 'гитхаб'],
  [/\bGit\b/g, 'гит'],
  [/\bJavaScript\b/g, 'джаваскрипт'],
  [/\bHTML\b/g, 'эйч-ти-эм-эл'],
  [/\bCSS\b/g, 'си-эс-эс'],
  [/\blocalhost\b/g, 'локалхост'],
  [/\bstaging\b/g, 'стейджинг'],
  [/\bF12\b/g, 'эф двенадцать'],
  [/\bConsole\b/g, 'консоль'],
  [/\bGPT\b/g, 'джи-пи-ти'],
  [/\bGemini\b/g, 'джемини'],
  [/\bMCP\b/g, 'эм-си-пи'],
  [/\bAPI\b/g, 'эй-пи-ай'],
  [/\b(Opus|Sonnet|Haiku) (\d+)\.(\d+)\b/g, '$1 $2 $3'],
  [/\bOpus\b/g, 'опус'],
  [/\bSonnet\b/g, 'сонет'],
  [/\bHaiku\b/g, 'хайку'],
  [/\bSol\b/g, 'сол'],
  [/\bArgon\b/g, 'аргон'],
  [/\blow\b/g, 'лоу'],
  [/\bmax\b/g, 'макс'],
  [/\bPro\b/g, 'про'],
  [/\bSupabase\b/g, 'супабейс'],
  [/\bRLS\b/g, 'эр-эл-эс'],
  [/\bSQL\b/g, 'эс-кью-эл'],
  [/\bIDOR\b/g, 'айдор'],
  [/\bPlan\b/g, 'план'],
  [/\bGPL\b/g, 'джи-пи-эл'],
  [/\bFigma Make\b/g, 'фигма мейк'],
  [/\bLovable\b/g, 'лавабл'],
  [/\bBolt\b/g, 'болт'],
  [/\bv0\b/g, 'ви-зиро'],
  [/\bReplit\b/g, 'реплит'],
  [/\bCodex\b/g, 'кодекс'],
  [/\bAntigravity CLI\b/g, 'антигравити си-эл-ай'],
  [/\bJupyter\b/g, 'юпитер'],
  [/\bCtrl \+ ;/g, 'контрол плюс точка с запятой'],
  [/\/btw\b/g, 'би-ти-дабл-ю'],
  [/ЦКОКФ/g, 'цэ-ка-о-ка-эф'],
  [/\bCRUD\b/g, 'крад'],
  [/\bStack Overflow\b/g, 'стэк оверфлоу'],
  [/\bgit log\b/g, 'гит лог'],
  [/\bgit revert\b/g, 'гит риверт'],
  [/\/rewind\b/g, 'ривайнд'],
  [/\bEsc\b/g, 'эскейп'],
  [/\s*×\s*/g, ' на '],
  [/\s*→\s*/g, ', '],
]

export function spokenText(text: string): string {
  return SAY.reduce((s, [re, say]) => s.replace(re, say), text)
}
