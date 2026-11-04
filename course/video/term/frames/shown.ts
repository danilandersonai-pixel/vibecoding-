import type { FrameCtx } from '../frame'
import { plan as agentPlan } from './agentPlan'
import { plan as browserPlan } from './browserPlan'
import { plan as diffPlan } from './diffPlan'
import { plan as editorPlan } from './editorPlan'
import { plan as gitLogPlan } from './gitLogPlan'
import type { FrameSpec } from './index'
import { plan as terminalPlan } from './terminalPlan'

/**
 * Что зритель увидит в кадре из записи: строки по тем же планам, по которым кадр рисует (диапазоны lines и consoleLines,
 * консоль — как в DevTools). Terminal — команда с подсказкой и показанный вывод (у browser — строки server);
 * Editor и Diff — показанные строки файла и диффа; Agent — запрос, строки шагов и ответ; GitLog — хеш и сообщение;
 * Browser — строки страницы и сообщения консоли. Кадры без записей — пусто: их текст пишет автор урока.
 * Неверная ссылка на запись не роняет: показано то, что кадр смог собрать (о ссылке скажут его problems).
 */
export function shownLines(spec: FrameSpec, ctx: FrameCtx): string[] {
  switch (spec.type) {
    case 'terminal':
      return terminalPlan(spec, ctx).entries.flatMap((e) => [...(e.cmdRows.length > 0 ? [e.prompt + e.cmd] : []), ...e.lines.map((l) => l.text)])
    case 'editor':
      return editorPlan(spec, ctx).lines.map((l) => l.text)
    case 'diff':
      return diffPlan(spec, ctx).items.flatMap((i) => i.lines.map((l) => l.raw))
    case 'agent': {
      const p = agentPlan(spec, ctx)
      if (!p.ok) return []
      const steps = p.steps.flatMap((s) => s.lines.map((l) => (l.diff?.sign ?? '') + l.rows.join('')))
      return [p.promptText, ...steps, ...p.reply.lines, ...(p.code?.lines.filter((l) => !l.more).map((l) => l.text) ?? [])]
    }
    case 'gitlog':
      return gitLogPlan(spec, ctx).nodes.map((n) => `${n.hash} ${n.message}`)
    case 'browser': {
      const p = browserPlan(spec, ctx)
      const page = [...new Set([...p.before, ...p.after].map((i) => i.text))]
      return [...page, ...p.messages.map((m) => m.rows.join(' '))]
    }
    default:
      return []
  }
}
