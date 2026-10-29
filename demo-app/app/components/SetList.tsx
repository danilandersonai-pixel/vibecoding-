// Подходы тренировки списком: «60 кг × 8» в строке. Один вывод для карточки подопечного у тренера (app/clients/[id])
// и страницы тренировки (app/workouts/[id]); отступы задаёт страница через className.
// id подхода из запроса к sets приходит строкой, из json_agg — числом.
type ListedSet = { id: string | number; weight: number; reps: number };

export default function SetList({ sets, className }: { sets: ListedSet[]; className?: string }) {
  return (
    <ul className={className}>
      {sets.map((set) => (
        <li key={set.id}>
          {set.weight} кг × {set.reps}
        </li>
      ))}
    </ul>
  );
}
