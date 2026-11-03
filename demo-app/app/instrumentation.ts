import type { Instrumentation } from "next";

// Журнал сбоев. Next вызывает onRequestError на сервере при каждой ошибке: страница, маршрут, серверное действие.
// Путь запроса и сообщение ошибки — в таблицу errors (0016_errors.sql) от владельца базы, время ставит база.
// Человек видит app/error.tsx без подробностей, а здесь они остаются для нас.
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  // база — только у сервера на Node: в среде Edge модуля pg нет
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { pool } = await import("@/lib/db");
    const message = error instanceof Error ? error.message : String(error);
    try {
      await pool.query("insert into errors (path, message) values ($1, $2)", [request.path, message]);
    } catch (failed) {
      // журнал недоступен — сбой хотя бы останется в выводе сервера
      console.error("Журнал сбоев недоступен:", failed);
    }
  }
};
