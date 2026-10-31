// Личные рекорды подопечного: лучший вес в каждом упражнении. Упражнений в тренировке пока нет,
// поэтому упражнение — тренировки с одним названием («Ноги»). Тесты — lib/records.test.ts.
import type { WorkoutSet } from "./volume";

export type TitledWorkout = { title: string; sets: WorkoutSet[] };

// Рекорд среди подходов — самый большой вес, сколько бы ни было повторов. Без подходов рекорда нет — null.
export function bestWeight(sets: WorkoutSet[]): number | null {
  if (sets.length === 0) return null;
  return Math.max(...sets.map((set) => set.weight));
}

// Рекорды по упражнениям: название тренировки → рекорд среди подходов всех тренировок с этим названием.
// Тренировки без подходов рекорда не дают.
export function records(workouts: TitledWorkout[]): Map<string, number> {
  const setsByTitle = new Map<string, WorkoutSet[]>();
  for (const { title, sets } of workouts) {
    setsByTitle.set(title, [...(setsByTitle.get(title) ?? []), ...sets]);
  }
  const result = new Map<string, number>();
  for (const [title, sets] of setsByTitle) {
    const weight = bestWeight(sets);
    if (weight !== null) result.set(title, weight);
  }
  return result;
}
