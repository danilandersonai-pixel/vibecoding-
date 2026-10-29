import { ImageResponse } from "next/og";

// Иконка приложения: Next рисует её из разметки в PNG и подключает как значок страницы; манифест ссылается на тот же адрес /icon.
// Рисунок без букв — штанга из прямоугольников, поэтому от шрифтов он не зависит.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

const PLATE = "#fafafa";
const BAR = "#a1a1aa";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181b",
        }}
      >
        {/* штанга: по два блина с каждой стороны грифа, внешние выше внутренних */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 40, height: 240, background: PLATE, borderRadius: 10 }} />
          <div style={{ width: 40, height: 170, background: PLATE, borderRadius: 10, marginLeft: 12 }} />
          <div style={{ width: 190, height: 30, background: BAR, marginLeft: 12 }} />
          <div style={{ width: 40, height: 170, background: PLATE, borderRadius: 10, marginLeft: 12 }} />
          <div style={{ width: 40, height: 240, background: PLATE, borderRadius: 10, marginLeft: 12 }} />
        </div>
      </div>
    ),
    size,
  );
}
