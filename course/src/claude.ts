// Минимальные типы среды Claude, которыми пользуется курс. Вне Claude window.claude нет.

export type DocSnapshot = { exists: boolean; data(): Record<string, unknown> | undefined }
export type DocRef = { get(): Promise<DocSnapshot>; set(data: Record<string, unknown>): Promise<void> }
export type DbLike = { doc(path: string): DocRef }
export type UserLike = { id(): Promise<string | null> }

export type SampleOptions = {
  onText?: (u: { text: string; delta: string }) => void
  signal?: AbortSignal
  modelTier?: 'default' | 'complex' | 'quick'
  cache?: boolean
}
export type SampleLike = ((input: string, opts?: SampleOptions) => Promise<{ text: string; truncated: boolean }>) & {
  json(input: string, opts?: SampleOptions): Promise<unknown>
}

export type DownloadsLike = { save(req: { filename: string; data: Blob }): Promise<unknown> }

export type ClaudeLike = { use(name: string): Promise<unknown> }

declare global {
  interface Window {
    claude?: ClaudeLike
  }
}

export function getClaude(): ClaudeLike | undefined {
  return typeof window === 'undefined' ? undefined : window.claude
}
