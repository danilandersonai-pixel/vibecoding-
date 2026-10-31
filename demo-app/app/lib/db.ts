import { Pool, type PoolClient } from "pg";

// Подключение к базе по DATABASE_URL из .env.local — от имени её владельца, и RLS на такие запросы не действует.
// Напрямую через pool ходит только вход (app/api/login), как сервис входа в Supabase; остальное — через asUser.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Запросы от имени вошедшего — так их выполняет Supabase: роль authenticated, а auth.uid() в базе возвращает uid.
// Всё внутри fn идёт одной транзакцией, и какие строки видны, решают политики RLS.
export async function asUser<T>(uid: string, fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect();
  const original = db.query;
  const run = original.bind(db);
  try {
    await run("begin");
    await run("set local role authenticated");
    await run("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: uid, role: "authenticated" }),
    ]);
    // Только в режиме разработки (next dev): на время запросов приложения подменяем db.query обёрткой и печатаем
    // в журнал сервера каждый запрос — «[sql] …». В тестах (NODE_ENV=test), сборке и на сервере (production) журнал молчит.
    // Служебные команды транзакции и роли идут мимо (через run), в журнал не попадают — так видно число запросов на страницу.
    if (process.env.NODE_ENV === "development") {
      db.query = ((text: unknown, ...args: unknown[]) => {
        const sql = typeof text === "string" ? text : (text as { text: string }).text;
        console.log(`[sql] ${String(sql).replace(/\s+/g, " ").trim()}`);
        return (run as (...rest: unknown[]) => unknown)(text, ...args);
      }) as PoolClient["query"];
    }
    const result = await fn(db);
    await run("commit");
    return result;
  } catch (err) {
    await run("rollback");
    throw err;
  } finally {
    db.query = original;
    db.release();
  }
}
