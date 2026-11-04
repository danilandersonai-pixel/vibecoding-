// Отчёт тренера за месяц по неделям — определения в docs/report.md, тесты — lib/report.test.ts.
// Дни — строки «ГГГГ-ММ-ДД», как в базе (day::text): недели считаются без часов и часового пояса.
import { records } from "./records";
import { volume, type WorkoutSet } from "./volume";

export type ReportWorkout = { title: string; day: string; sets: WorkoutSet[] };

// Неделя отчёта: понедельник и воскресенье; тренировок, объём и средний объём на тренировку, кг;
// у недели без тренировок среднего нет — null (docs/report.md); рекорды по названию тренировки за всё время до конца недели
export type ReportWeek = {
  start: string;
  end: string;
  workouts: number;
  volume: number;
  average: number | null;
  records: Map<string, number>;
};

type Week = { start: string; end: string };

// День «ГГГГ-ММ-ДД» плюс n дней (счёт в UTC — сутки всегда 24 часа)
function addDays(day: string, n: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

// Недели месяца «ГГГГ-ММ» с понедельника по воскресенье — все, где есть хотя бы один день месяца
function weeksOf(month: string): Week[] {
  const first = `${month}-01`;
  // понедельник недели, где 1-е число: у getUTCDay() воскресенье — 0, понедельник — 1
  let start = addDays(first, -((new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7));
  const weeks: Week[] = [];
  while (start.slice(0, 7) <= month) {
    weeks.push({ start, end: addDays(start, 6) });
    start = addDays(start, 7);
  }
  return weeks;
}

// Отчёт подопечного за месяц: по неделям — его тренировки с днём в неделе, их объём и средний, рекорды до конца недели
export function monthReport(month: string, workouts: ReportWorkout[]): ReportWeek[] {
  return weeksOf(month).map(({ start, end }) => {
    const week = workouts.filter((w) => w.day >= start && w.day <= end);
    const total = volume(week.flatMap((w) => w.sets));
    return {
      start,
      end,
      workouts: week.length,
      volume: total,
      average: week.length === 0 ? null : Math.round(total / week.length),
      records: records(workouts.filter((w) => w.day <= end)),
    };
  });
}
