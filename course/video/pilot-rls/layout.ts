import { theme } from '../theme'

// Общие координаты кадра 1280×720: по ним рисуют сцены и считаются горячие точки.
export const L = {
  phone: { x: 250, y: 300 },
  server: { x: 640, y: 300 },
  db: { x: 1060, y: 300 },
  packetAbovePhone: { x: 250, y: 120 },
  callout: { x: 640, y: 110 },
  // Сцена 4: база справа, турникеты слева от строк.
  s4db: { x: 1010, y: 280 },
  s4gateX: 790,
  s4rowsY: [190, 280, 370],
} as const

// Строки базы в сценах 2 и 3.
export const DB_ROWS = [
  { text: '17 · Анна', color: theme.accent },
  { text: '18 · Олег', color: theme.alt },
  { text: '19 · Игорь', color: theme.alt },
]
