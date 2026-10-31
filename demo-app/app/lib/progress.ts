// Прогресс подопечного для тренера — сценарий 3 из docs/spec.md: по строке на тренировку, по порядку дат.
// В строке — день, лучший вес (lib/records.ts) и объём (lib/volume.ts). Из этих строк карточка подопечного рисует график.
// Тесты — lib/progress.test.ts.
import { bestWeight } from "./records";
import { volume, type WorkoutSet } from "./volume";

export type ProgressRow = { day: Date; weight: number | null; volume: number };

export function progress(workouts: { day: Date; sets: WorkoutSet[] }[]): ProgressRow[] {
  return [...workouts]
    .sort((a, b) => a.day.getTime() - b.day.getTime())
    .map(({ day, sets }) => ({ day, weight: bestWeight(sets), volume: volume(sets) }));
}
