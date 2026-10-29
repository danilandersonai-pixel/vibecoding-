// Объём тренировки, кг: сумма «вес × повторы» по подходам; у тренировки без подходов — 0.
// Три подхода по 10 раз с весом 50 кг — 1500 кг.
export type WorkoutSet = { weight: number; reps: number };

export function volume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, { weight, reps }) => sum + weight * reps, 0);
}
