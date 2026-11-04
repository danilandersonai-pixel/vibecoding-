// График прогресса подопечного: объём каждой тренировки — столбиком, слева направо по дате. SVG рисуем сами, без библиотек.
// Высота столбика — объём относительно наибольшего; под столбиком — дата тренировки. Цвет берёт у текста (currentColor).
import { formatDay } from "@/lib/dates";

type Point = { day: Date; volume: number };

export default function ProgressChart({ data }: { data: Point[] }) {
  if (data.length === 0) return null;
  const width = 320;
  const barsHeight = 160;
  const gap = 12;
  const labels = 20;
  const max = Math.max(...data.map((point) => point.volume), 1);
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Прогресс: объём по тренировкам</h2>
      <svg viewBox={`0 0 ${width} ${barsHeight + labels}`} className="mt-3 w-full text-zinc-900" role="img" aria-label="Объём тренировок по датам">
        {data.map((point, i) => {
          const barHeight = Math.round((point.volume / max) * barsHeight);
          const x = i * (barWidth + gap);
          return (
            <g key={i}>
              <rect x={x} y={barsHeight - barHeight} width={barWidth} height={barHeight} fill="currentColor" />
              <text x={x + barWidth / 2} y={barsHeight + 14} textAnchor="middle" fontSize="10" fill="currentColor">
                {formatDay(point.day)}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
