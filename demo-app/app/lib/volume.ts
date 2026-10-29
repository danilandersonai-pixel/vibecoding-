// Объём тренировки, кг: сумма «вес × повторы» по подходам; у тренировки без подходов — 0.
// Три подхода по 10 раз с весом 50 кг — 1500 кг. Целым числом: 62,5 кг × 5 — 313 кг.
export type WorkoutSet = { weight: number; reps: number };

export function volume(sets: WorkoutSet[]): number {
  return Math.round(sets.reduce((sum, { weight, reps }) => sum + weight * reps, 0));
}
