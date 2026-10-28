import type { FrameDef } from '../frame'
import { Agenda } from './Agenda'
import { agendaLayout, agendaMoments, agendaProblems } from './agendaPlan'
import type { AgendaSpec } from './agendaPlan'
import { Agent } from './Agent'
import { agentLayout, agentMoments, agentProblems } from './agentPlan'
import type { AgentSpec } from './agentPlan'
import { Board } from './Board'
import { boardLayout, boardMoments, boardProblems } from './boardPlan'
import type { BoardSpec } from './boardPlan'
import { Browser } from './Browser'
import { browserLayout, browserMoments, browserProblems } from './browserPlan'
import type { BrowserSpec } from './browserPlan'
import { Diff } from './Diff'
import { diffLayout, diffMoments, diffProblems } from './diffPlan'
import type { DiffSpec } from './diffPlan'
import { Editor } from './Editor'
import { editorLayout, editorMoments, editorProblems } from './editorPlan'
import type { EditorSpec } from './editorPlan'
import { Figure } from './Figure'
import { figureLayout, figureMoments, figureProblems } from './figurePlan'
import type { FigureSpec } from './figurePlan'
import { GitLog } from './GitLog'
import { gitLogLayout, gitLogMoments, gitLogProblems } from './gitLogPlan'
import type { GitLogSpec } from './gitLogPlan'
import { Recap } from './Recap'
import { recapLayout, recapMoments, recapProblems } from './recapPlan'
import type { RecapSpec } from './recapPlan'
import { Terminal } from './Terminal'
import { terminalLayout, terminalMoments, terminalProblems } from './terminalPlan'
import type { TerminalSpec } from './terminalPlan'

// Кадры набора «Репозиторий»: по типу кадра в сцене — его описание (части, моменты, проверки, разметка).
// Номера строк для lines и highlight печатает `node scripts/print-event.mjs <сессия> <событие>` (из course/).
export type { AgendaSpec, AgentSpec, BoardSpec, BrowserSpec, DiffSpec, EditorSpec, FigureSpec, GitLogSpec, RecapSpec, TerminalSpec }
export type FrameSpec = TerminalSpec | EditorSpec | DiffSpec | AgentSpec | GitLogSpec | BrowserSpec | FigureSpec | BoardSpec | AgendaSpec | RecapSpec

export const FRAMES: { [K in FrameSpec['type']]: FrameDef<Extract<FrameSpec, { type: K }>> } = {
  terminal: { layout: terminalLayout, moments: terminalMoments, problems: terminalProblems, Component: Terminal },
  editor: { layout: editorLayout, moments: editorMoments, problems: editorProblems, Component: Editor },
  diff: { layout: diffLayout, moments: diffMoments, problems: diffProblems, Component: Diff },
  agent: { layout: agentLayout, moments: agentMoments, problems: agentProblems, Component: Agent },
  gitlog: { layout: gitLogLayout, moments: gitLogMoments, problems: gitLogProblems, Component: GitLog },
  browser: { layout: browserLayout, moments: browserMoments, problems: browserProblems, Component: Browser },
  figure: { layout: figureLayout, moments: figureMoments, problems: figureProblems, Component: Figure },
  board: { layout: boardLayout, moments: boardMoments, problems: boardProblems, Component: Board },
  agenda: { layout: agendaLayout, moments: agendaMoments, problems: agendaProblems, Component: Agenda },
  recap: { layout: recapLayout, moments: recapMoments, problems: recapProblems, Component: Recap },
}

/** Описание кадра по его спеке: тип спеки определяет и данные, и разметку, поэтому приведение одно, здесь. */
export function frameDef<S extends FrameSpec>(spec: S): FrameDef<S> {
  return FRAMES[spec.type] as unknown as FrameDef<S>
}
