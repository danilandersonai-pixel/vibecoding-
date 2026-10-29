// Заготовка оплаты подписки тренера. Секрет платёжной системы берём из окружения (.env.local), в коде его нет:
// сканер секретов не пустит ключ в коммит, а на сервере его читает process.env.
const PAY_SECRET = process.env.PAY_SECRET ?? "";

export type Subscription = { coachId: string; plan: "month" | "year" };

// Пока заглушка: позже здесь будет вызов платёжной системы с PAY_SECRET.
export async function startPayment(sub: Subscription): Promise<{ ok: boolean; plan: Subscription["plan"] }> {
  if (!PAY_SECRET) throw new Error("Не задан PAY_SECRET");
  return { ok: true, plan: sub.plan };
}
