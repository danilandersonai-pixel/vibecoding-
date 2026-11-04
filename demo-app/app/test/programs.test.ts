// @vitest-environment node
// Требование: правка и удаление строки шаблона не меняют прошлые тренировки и их подходы.
// Данные тест создаёт сам — в одной транзакции, а в конце откатывает (rollback): в базе после него ничего не остаётся.
// Нужна база с миграциями и seed из supabase/, адрес — DATABASE_URL из окружения, как у test/rls.test.ts.
import { afterAll, expect, test } from "vitest";
import { pool } from "../lib/db";

// id из supabase/seed.sql: тренер Марина и прошлая тренировка её подопечной Анны — «Ноги» 19 октября
const MARINA = "11111111-1111-1111-1111-111111111111";
const LEGS = 1;

afterAll(() => pool.end());

test("правка и удаление строки шаблона не меняют прошлую тренировку и её подходы", async () => {
  const db = await pool.connect();
  // первое значение первой строки ответа: id вставленной строки или число
  const one = async (sql: string, params: unknown[]) => Object.values((await db.query(sql, params)).rows[0])[0];
  // сколько подходов записано к строке тренировки
  const setsOf = (item: unknown) => one("select count(*)::int from sets where workout_item_id = $1", [item]);
  try {
    await db.query("begin");
    // программа Марины из библиотеки: присед 3 × 10 и тяга 3 × 8
    const program = await one("insert into programs (coach_id, title) values ($1, 'Ноги') returning id", [MARINA]);
    const squat = await one(
      "insert into program_items (program_id, exercise_id, sets, reps) select $1, id, 3, 10 from exercises where name = 'Присед' returning id",
      [program],
    );
    const pull = await one(
      "insert into program_items (program_id, exercise_id, sets, reps) select $1, id, 3, 8 from exercises where name = 'Тяга' returning id",
      [program],
    );
    // назначение: строки шаблона — в тренировку Анны; к приседу — три подхода
    const item = await one("insert into workout_items (workout_id, program_item_id) values ($1, $2) returning id", [LEGS, squat]);
    await one("insert into workout_items (workout_id, program_item_id) values ($1, $2) returning id", [LEGS, pull]);
    await db.query(
      "insert into sets (workout_id, workout_item_id, weight, reps) values ($1, $2, 50, 10), ($1, $2, 50, 10), ($1, $2, 50, 10)",
      [LEGS, item],
    );

    // присед удалили из шаблона — подходы прошлой тренировки на месте
    await db.query("delete from program_items where id = $1", [squat]);
    expect(await setsOf(item), "подходов").toBe(3);

    // тягу в шаблоне заменили подтягиваниями — упражнения прежние
    await db.query("update program_items set exercise_id = (select id from exercises where name = 'Подтягивания') where id = $1", [pull]);
    const { rows } = await db.query<{ exercise: string; sets: number; reps: number }>(
      "select exercise, sets, reps from workout_exercises where workout_id = $1 order by id",
      [LEGS],
    );
    expect(rows.map((row) => `${row.exercise} — ${row.sets} × ${row.reps}`)).toEqual(["Присед — 3 × 10", "Тяга — 3 × 8"]);
  } finally {
    await db.query("rollback");
    db.release();
  }
});
