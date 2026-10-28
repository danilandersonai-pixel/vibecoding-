import type { FrameDef } from '../frame'
import { Diff } from './Diff'
import { diffLayout, diffMoments, diffProblems } from './diffPlan'
import type { DiffSpec } from './diffPlan'
import { Editor } from './Editor'
import { editorLayout, editorMoments, editorProblems } from './editorPlan'
import type { EditorSpec } from './editorPlan'
import { Terminal } from './Terminal'
import { terminalLayout, terminalMoments, terminalProblems } from './terminalPlan'
import type { TerminalSpec } from './terminalPlan'

// Кадры набора «Репозиторий»: по типу кадра в сцене — его описание (части, моменты, проверки, разметка).
// Задачи 6–7 дописывают сюда Agent, GitLog, Browser и остальные.
export type { DiffSpec, EditorSpec, TerminalSpec }
export type FrameSpec = TerminalSpec | EditorSpec | DiffSpec

export const FRAMES: { [K in FrameSpec['type']]: FrameDef<Extract<FrameSpec, { type: K }>> } = {
  terminal: { layout: terminalLayout, moments: terminalMoments, problems: terminalProblems, Component: Terminal },
  editor: { layout: editorLayout, moments: editorMoments, problems: editorProblems, Component: Editor },
  diff: { layout: diffLayout, moments: diffMoments, problems: diffProblems, Component: Diff },
}
