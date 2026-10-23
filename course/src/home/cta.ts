import type { CurrentDay } from '../course/currentDay'

// Главная кнопка обложки: новичку — «Начать день 1», вернувшемуся — «Продолжить день N» (его текущий день)
export function coverCta(state: CurrentDay): { label: string; to: string } {
  return { label: state.returning ? `Продолжить день ${state.n}` : 'Начать день 1', to: `#/day/${state.n}` }
}
