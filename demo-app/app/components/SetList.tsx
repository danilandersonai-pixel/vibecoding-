// Подходы тренировки списком: «60 кг × 8» в строке. Один вывод для карточки подопечного у тренера (app/clients/[id])
// и страницы тренировки (app/workouts/[id]); отступы задаёт страница через className.
// id подхода из запроса к sets приходит строкой, из json_agg — числом.
// Заметка подопечного (note) — строкой под подходом; нет заметки (null или поля нет) — под подходом ничего.
type ListedSet = { id: string | number; weight: number; reps: number; note?: string | null };

export default function SetList({ sets, className }: { sets: ListedSet[]; className?: string }) {
  return (
    <ul className={className}>
      {sets.map((set) => (
        <li key={set.id}>
          {set.weight} кг × {set.reps}
          {set.note && <p className="text-zinc-500">{set.note}</p>}
        </li>
      ))}
    </ul>
  );
}
