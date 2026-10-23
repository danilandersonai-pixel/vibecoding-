import type { CurrentDay } from '../course/currentDay'

// Кнопка обложки — переход в день (to) или прокрутка к разделу главной (scrollTo, id), адрес при этом не меняется
export type CoverCta = { label: string; to: string } | { label: string; scrollTo: string }

// Главная кнопка обложки: новичку — «Начать день 1», вернувшемуся — «Продолжить день N» (его текущий день),
// выпускнику — «К карте»: все дни пройдены, звать в день 21 незачем
export function coverCta(state: CurrentDay): CoverCta {
  if (state.allDone) return { label: 'К карте', scrollTo: 'map' }
  return { label: state.returning ? `Продолжить день ${state.n}` : 'Начать день 1', to: `#/day/${state.n}` }
}
