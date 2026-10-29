// Данные пока лежат здесь, а не в базе: так экраны можно делать до базы и входа.
// Когда появится база, тренировки переедут в неё, а функции ниже останутся с теми же именами.

export type WorkoutSet = { weight: number; reps: number };

export const CLIENTS = { anna: "Анна", oleg: "Олег" } as const;
export type ClientId = keyof typeof CLIENTS;

export type Workout = {
  id: number;
  client: ClientId;
  name: string;
  date: string; // ГГГГ-ММ-ДД
  sets: WorkoutSet[];
};

// Входа пока нет, поэтому текущая подопечная — константа. Со входом её заменит человек из сессии.
export const CURRENT_CLIENT: ClientId = "anna";

const WORKOUTS: Workout[] = [
  {
    id: 1,
    client: "anna",
    name: "Ноги",
    date: "2026-10-19",
    sets: [
      { weight: 50, reps: 10 },
      { weight: 50, reps: 10 },
      { weight: 50, reps: 10 },
    ],
  },
  {
    id: 2,
    client: "anna",
    name: "Спина и бицепс",
    date: "2026-10-21",
    sets: [
      { weight: 40, reps: 12 },
      { weight: 40, reps: 10 },
      { weight: 45, reps: 8 },
    ],
  },
  {
    id: 3,
    client: "anna",
    name: "Грудь и плечи",
    date: "2026-10-26",
    sets: [
      { weight: 30, reps: 10 },
      { weight: 30, reps: 10 },
      { weight: 35, reps: 8 },
    ],
  },
  {
    id: 4,
    client: "oleg",
    name: "Присед и тяга",
    date: "2026-10-20",
    sets: [
      { weight: 60, reps: 8 },
      { weight: 60, reps: 8 },
      { weight: 65, reps: 6 },
    ],
  },
  {
    id: 5,
    client: "oleg",
    name: "Жим лёжа",
    date: "2026-10-27",
    sets: [
      { weight: 50, reps: 10 },
      { weight: 55, reps: 8 },
    ],
  },
];

// Тренировки одной подопечной: чужие сюда не попадают
export function workoutsOf(client: ClientId): Workout[] {
  return WORKOUTS.filter((workout) => workout.client === client);
}

// Объём тренировки, кг: сумма «вес × повторы» по подходам.
// Три подхода по 10 раз с весом 50 кг — 1500 кг.
export function volume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
}
