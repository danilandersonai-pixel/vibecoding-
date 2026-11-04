import type { JSX } from 'react'
import type { Find } from '../sessions/types'

// Контракт кадра набора «Репозиторий» (Terminal, Editor, Diff, Agent, GitLog, Browser, Figure, Board, Agenda, Recap).
// Кадр — чистая разметка по данным сцены: сначала прямоугольники своих частей, на них ссылаются камера и пояснения по нажатию.

/** Прямоугольник на холсте 1920 × 1080. */
export type Rect = { x: number; y: number; w: number; h: number }

/** Часы сцены: когда начинается каждая реплика (из них же считаются субтитры и озвучка). */
export type Clock = {
  /** Кадр сцены, на котором начинается реплика i. */
  beat(i: number): number
  /** Длина сцены, кадров. */
  duration: number
  /** Сколько реплик в сцене. */
  lines: number
}

/** Урок, в котором показан кадр: id ролика, названия глав и разделы книги. */
export type LessonInfo = { id: string; title: string; chapters: string[]; book: string[] }

/** Что кадру нужно, кроме данных сцены: записи сессий и описание урока. */
export type FrameCtx = { find: Find; lesson: LessonInfo }

export type FrameDef<S> = {
  /** Части кадра на холсте; всегда есть 'frame' — весь кадр. */
  layout(spec: S, ctx: FrameCtx): Record<string, Rect>
  /** Кадры сцены, где картинка меняется: из них проверяется, что она не стоит дольше MOTION.maxStill. */
  moments(spec: S, clock: Clock, ctx: FrameCtx): number[]
  /**
   * С какого кадра сцены часть видна (на нём и дальше она в кадре): набираемый текст — когда набран целиком, строка и сообщение — на своём
   * кадре, блок строк (вывод, шаг агента, ответ, консоль) — с первой строки, проявление — с первого кадра, где непрозрачность больше нуля.
   * Есть у кадров, где части приходят позже своей реплики: Terminal (набор 30 знаков/с, вывод очередью), Agent (шаги ждут конца набора
   * запроса), Browser (очередь строк страницы, action, консоль). Частей, видных с начала сцены, в карте нет.
   * По ней lessonProblems не даёт пояснению открыться раньше его цели.
   */
  appears?(spec: S, clock: Clock, ctx: FrameCtx): Map<string, number>
  /** Проблемы данных: неверные ссылки на записи, диапазоны, переполнение. Пусто — всё в порядке. */
  problems(spec: S, ctx: FrameCtx, clock: Clock): string[]
  /** Разметка: <g> внутри общего <svg viewBox="0 0 1920 1080">. */
  Component(props: { spec: S; clock: Clock; ctx: FrameCtx }): JSX.Element
}
