import type { FrameDef } from '../frame'
import { Agent } from './Agent'
import { agentLayout, agentMoments, agentProblems } from './agentPlan'
import type { AgentSpec } from './agentPlan'
import { Browser } from './Browser'
import { browserLayout, browserMoments, browserProblems } from './browserPlan'
import type { BrowserSpec } from './browserPlan'
import { Diff } from './Diff'
import { diffLayout, diffMoments, diffProblems } from './diffPlan'
import type { DiffSpec } from './diffPlan'
import { Editor } from './Editor'
import { editorLayout, editorMoments, editorProblems } from './editorPlan'
import type { EditorSpec } from './editorPlan'
import { GitLog } from './GitLog'
import { gitLogLayout, gitLogMoments, gitLogProblems } from './gitLogPlan'
import type { GitLogSpec } from './gitLogPlan'
import { Terminal } from './Terminal'
import { terminalLayout, terminalMoments, terminalProblems } from './terminalPlan'
import type { TerminalSpec } from './terminalPlan'

// Кадры набора «Репозиторий»: по типу кадра в сцене — его описание (части, моменты, проверки, разметка).
// Задача 7 дописывает сюда Figure, Board, Agenda и Recap.
// Номера строк для lines и highlight печатает `node scripts/print-event.mjs <сессия> <событие>` (из course/).
export type { AgentSpec, BrowserSpec, DiffSpec, EditorSpec, GitLogSpec, TerminalSpec }
export type FrameSpec = TerminalSpec | EditorSpec | DiffSpec | AgentSpec | GitLogSpec | BrowserSpec

export const FRAMES: { [K in FrameSpec['type']]: FrameDef<Extract<FrameSpec, { type: K }>> } = {
  terminal: { layout: terminalLayout, moments: terminalMoments, problems: terminalProblems, Component: Terminal },
  editor: { layout: editorLayout, moments: editorMoments, problems: editorProblems, Component: Editor },
  diff: { layout: diffLayout, moments: diffMoments, problems: diffProblems, Component: Diff },
  agent: { layout: agentLayout, moments: agentMoments, problems: agentProblems, Component: Agent },
  gitlog: { layout: gitLogLayout, moments: gitLogMoments, problems: gitLogProblems, Component: GitLog },
  browser: { layout: browserLayout, moments: browserMoments, problems: browserProblems, Component: Browser },
}

/** Описание кадра по его спеке: тип спеки определяет и данные, и разметку, поэтому приведение одно, здесь. */
export function frameDef<S extends FrameSpec>(spec: S): FrameDef<S> {
  return FRAMES[spec.type] as unknown as FrameDef<S>
}
