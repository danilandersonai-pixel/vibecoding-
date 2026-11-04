import type { MetadataRoute } from "next";

// Манифест приложения: по нему телефон предлагает «Установить» и открывает сайт как приложение, без адресной строки.
// Next отдаёт его по адресу /manifest.webmanifest и подключает на каждой странице; иконка — из app/icon.tsx (адрес /icon).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Тренер",
    short_name: "Тренер",
    description: "Дневник тренировок: тренер назначает, подопечный записывает вес и повторы",
    lang: "ru",
    // приложение с экрана телефона открывается на странице входа
    start_url: "/login",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#18181b",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
