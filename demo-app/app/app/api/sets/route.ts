// Подходы пока живут в памяти сервера: после перезапуска npm run dev список снова пустой.
type WorkoutSet = { weight: number; reps: number };

const sets: WorkoutSet[] = [];

// GET /api/sets — все сохранённые подходы
export async function GET() {
  return Response.json({ sets });
}

// POST /api/sets — сохранить подход { weight, reps }
export async function POST(request: Request) {
  const { weight, reps } = await request.json();

  // «62,5» — тоже вес: запятую меняем на точку
  const kg = Number(String(weight).replace(",", "."));
  if (!Number.isFinite(kg)) {
    return Response.json({ error: "Вес должен быть числом, например 60" }, { status: 400 });
  }

  const count = Number(reps);
  if (!Number.isInteger(count) || count <= 0) {
    return Response.json({ error: "Повторы — целое число больше нуля" }, { status: 400 });
  }

  const set = { weight: kg, reps: count };
  sets.push(set);
  return Response.json({ set, volume: kg * count }, { status: 201 });
}
