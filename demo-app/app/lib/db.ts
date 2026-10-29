import { Pool, type PoolClient } from "pg";

// Подключение к базе по DATABASE_URL из .env.local — от имени её владельца, и RLS на такие запросы не действует.
// Напрямую через pool ходит только вход (app/api/login), как сервис входа в Supabase; остальное — через asUser.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Запросы от имени вошедшего — так их выполняет Supabase: роль authenticated, а auth.uid() в базе возвращает uid.
// Всё внутри fn идёт одной транзакцией, и какие строки видны, решают политики RLS.
export async function asUser<T>(uid: string, fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  try {
    await db.query("begin");
    await db.query("set local role authenticated");
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: uid, role: "authenticated" }),
    ]);
    const result = await fn(db);
    await db.query("commit");
    return result;
  } catch (err) {
    await db.query("rollback");
    throw err;
  } finally {
    db.release();
  }
}
