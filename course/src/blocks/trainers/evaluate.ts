import type { PromptPart } from '../../content/schema'

type PartKey = PromptPart['key']

// «Собери запрос»: не выбрано — пропуск, выбран вариант из bad — слабое место.
export function evaluatePrompt(parts: PromptPart[], chosen: Partial<Record<PartKey, string>>): { missing: PartKey[]; weak: PartKey[]; ok: boolean } {
  const missing = parts.filter((p) => !chosen[p.key]).map((p) => p.key)
  const weak = parts.filter((p) => chosen[p.key] && !p.good.includes(chosen[p.key]!)).map((p) => p.key)
  return { missing, weak, ok: missing.length === 0 && weak.length === 0 }
}

export function evaluateBugs(bugLines: number[], clicked: number[]): { found: number[]; missed: number[]; wrong: number[] } {
  return {
    found: bugLines.filter((l) => clicked.includes(l)),
    missed: bugLines.filter((l) => !clicked.includes(l)),
    wrong: clicked.filter((l) => !bugLines.includes(l)),
  }
}

export function evaluateSort(items: { id: string; bucket: string }[], placed: Record<string, string>): { correct: string[]; wrong: string[] } {
  return {
    correct: items.filter((i) => placed[i.id] === i.bucket).map((i) => i.id),
    wrong: items.filter((i) => placed[i.id] !== i.bucket).map((i) => i.id),
  }
}
