// Комментарии к тренировке: «Анна: текст» по строке, под ними поле «Комментарий» и кнопка «Отправить».
// Один вывод для страницы тренировки у подопечного (app/workouts/[id]) и карточки подопечного у тренера (app/clients/[id]);
// отступы задаёт страница через className. Текст комментария React выводит как текст, а не как разметку.
export type WorkoutComment = { id: string; author: string; body: string };

type Props = {
  comments: WorkoutComment[];
  // действие формы: комментарий к этой тренировке от имени вошедшего (app/workouts/[id]/comments.ts)
  action: (form: FormData) => Promise<void>;
  className?: string;
};

export default function Comments({ comments, action, className }: Props) {
  return (
    <div className={className}>
      {comments.length === 0 ? (
        <p className="text-zinc-500">Комментариев пока нет</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {comments.map((comment) => (
            <li key={comment.id}>
              <span className="font-semibold">{comment.author}:</span> {comment.body}
            </li>
          ))}
        </ul>
      )}
      {/* подпись вокруг поля, а не htmlFor: на карточке тренера таких форм может быть несколько, и id не повторяются */}
      <form action={action} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Комментарий
          <textarea
            name="body"
            required
            maxLength={1000}
            rows={2}
            className="rounded border border-zinc-300 px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-white">
          Отправить
        </button>
      </form>
    </div>
  );
}
