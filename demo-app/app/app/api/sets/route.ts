import { parseWeight } from "@/lib/weight";

// Подходы пока живут в памяти сервера: после перезапуска npm run dev список снова пустой.
type WorkoutSet = { weight: number; reps: number };

const sets: WorkoutSet[] = [];

// GET /api/sets — все сохранённые подходы
export async function GET() {
  return Response.json({ sets });
}

// Число из поля формы: «62,5» — тоже число (запятую меняем на точку),
// а пустое поле — нет, хотя Number("") === 0
function toNumber(value: unknown): number {
  const text = String(value ?? "").trim().replace(",", ".");
  return text === "" ? NaN : Number(text);
}

// POST /api/sets — сохранить подход { weight, reps }
export async function POST(request: Request) {
  // не JSON в теле — ответ 400, а не падение сервера с 500
  const body = await request.json().catch(() => null);
  if (body === null || typeof body !== "object") {
    return Response.json({ error: "Нужен JSON: { weight, reps }" }, { status: 400 });
  }
  const { weight, reps } = body;

  // вес разбирает lib/weight.ts: число или текст ошибки
  const kg = parseWeight(String(weight ?? ""));
  if (typeof kg === "string") {
    return Response.json({ error: kg }, { status: 400 });
  }

  const count = toNumber(reps);
  if (!Number.isInteger(count) || count <= 0) {
    return Response.json({ error: "Повторы — целое число больше нуля" }, { status: 400 });
  }

  const set = { weight: kg, reps: count };
  sets.push(set);
  return Response.json({ set, volume: kg * count }, { status: 201 });
}
