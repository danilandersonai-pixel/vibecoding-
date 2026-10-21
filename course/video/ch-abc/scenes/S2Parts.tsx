import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Arrow, Card, Label } from '../../kit/parts'
import { stepAt } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { BAR, EDITOR_PAD, LH } from '../../kit/screens/layout'
import { Mono, Window } from '../../kit/screens/Window'
import { KeyGlyph } from '../../pilot-rls/scenes/KeyGlyph'
import { theme } from '../../theme'
import { S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { clamp } from './clamp'
import { Cloud, Mark } from './parts'

const ID = 's2-parts'

const RECIPE = ['1. взять вес и повторы', '2. вес не число?', '— покажи ошибку', '3. сохранить подход']
const CODE = ['// сохранить подход', 'function saveSet(weight, reps) {', '  if (!isNumber(weight)) {', "    return showError('Вес — число')", '  }', '  return api.save(weight, reps)', '}']
const LANGS = [
  { name: 'HTML и CSS', note: 'вид страницы' },
  { name: 'JavaScript', note: 'оживляет' },
  { name: 'TypeScript', note: 'ловит ошибки' },
  { name: 'Python', note: 'данные и ИИ' },
]
// файлы проекта: отступ, папка или файл
const FILES = [
  { name: 'src/', depth: 0, folder: true },
  { name: 'workout.ts', depth: 1, folder: false },
  { name: 'styles.css', depth: 1, folder: false },
  { name: 'package.json', depth: 0, folder: false },
  { name: '.env', depth: 0, folder: false },
]
const FILE_Y = [80, 120, 160, 210, 250]
const LIBS = ['календарь', 'графики', 'письма']

function FileGlyph({ x, y, folder, color }: { x: number; y: number; folder: boolean; color: string }) {
  return folder ? (
    <path d={`M${x} ${y - 16} h9 l3 4 h12 v16 h-24 Z`} fill={theme.altTint} stroke={color} strokeWidth={2} />
  ) : (
    <path d={`M${x + 2} ${y - 18} h13 l6 6 v18 h-19 Z`} fill={theme.paper} stroke={color} strokeWidth={2} />
  )
}

function Parcel({ x, y, w, h, text, ghost }: { x: number; y: number; w: number; h: number; text: string; ghost?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={ghost ? 'none' : theme.paper} stroke={ghost ? theme.line : theme.alt} strokeWidth={3} strokeDasharray={ghost ? '8 6' : undefined} />
      <rect x={x + 16} y={y + h / 2 - 14} width={28} height={28} rx={4} fill={ghost ? 'none' : theme.altTint} stroke={ghost ? theme.line : theme.alt} strokeWidth={2} />
      <line x1={x + 30} y1={y + h / 2 - 14} x2={x + 30} y2={y + h / 2 + 14} stroke={ghost ? theme.line : theme.alt} strokeWidth={2} />
      <Label x={x + 60} y={y + h / 2 + 8} anchor="start" size={22} color={ghost ? theme.soft : theme.ink} weight={500}>
        {text}
      </Label>
    </g>
  )
}

// Сцена 2: код — рецепт для компьютера; языки; файлы и проект; библиотеки и зависимости; ключи в .env.
export function S2Parts() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const R = S2.recipe
  const E = S2.editor
  const T = S2.tree
  const Lb = S2.libs
  const V = S2.env

  const recipe = useAppear(b(0))
  const toCode = interpolate(frame, [b(0) + 70, b(0) + 90], [0, 1], clamp)
  const example = useAppear(b(1) + 10)
  const link = interpolate(frame, [b(1) + 25, b(1) + 45], [0, 1], clamp)
  const langAt = [b(2) + 15, b(2) + 70, b(2) + 100, b(2) + 120]
  const project = useAppear(b(3) + 105)
  const libsHead = useAppear(b(4) + 5)
  const deps = interpolate(frame, [b(5) + 10, b(5) + 40], [0, 1], clamp)
  const depsWord = useAppear(b(5) + 15)
  const ghost = useAppear(b(5) + 85)
  const ghostNo = useAppear(b(5) + 105)
  const env = useAppear(b(6) + 15)
  const noChat = useAppear(b(6) + 80)
  const noHub = useAppear(b(6) + 105)

  // агент пишет код по рецепту → готово → ждёт
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 70, 'working'],
    [b(1) + 50, 'done'],
    [b(2) + 30, 'idle'],
  ])

  // строки кода «если вес не число — покажи ошибку» в редакторе
  const codeTop = E.y + BAR + EDITOR_PAD + 2 * LH

  return (
    <KitScene chip="2 / 6 · Код и чужие детали" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: рецепт → код */}
      <g opacity={recipe}>
        <Card x={R.x} y={R.y} w={R.w} h={R.h}>
          <Label x={R.x + 24} y={R.y + 40} anchor="start" size={26} weight={700}>
            Рецепт
          </Label>
          <g opacity={example}>
            <rect x={R.x + 10} y={R.y + 98} width={R.w - 20} height={70} rx={8} fill={theme.altTint} />
          </g>
          {RECIPE.map((t, i) => (
            <g key={t} opacity={interpolate(frame, [b(0) + 15 + i * 12, b(0) + 25 + i * 12], [0, 1], clamp)}>
              <Label x={R.x + 24 + (i === 2 ? 26 : 0)} y={R.y + 84 + i * 36 + (i >= 1 ? 4 : 0) + (i >= 3 ? 8 : 0)} anchor="start" size={22} weight={500}>
                {t}
              </Label>
            </g>
          ))}
        </Card>
      </g>
      <Arrow x1={R.x + R.w + 8} y1={R.y + 115} x2={E.x - 8} y2={R.y + 115} color={theme.accent} draw={toCode} />
      <Agent x={S2.agent.x} y={S2.agent.y} scale={0.75} enterAt={b(0) + 40} pose={agent} />
      {frame >= b(0) + 80 && <Editor x={E.x} y={E.y} w={E.w} at={b(0) + 80} file="workout.ts" lines={CODE} />}
      <g opacity={example}>
        <rect x={E.x + 3} y={codeTop} width={E.w - 6} height={LH * 2} fill={theme.altTint} />
        <rect x={E.x + 3} y={codeTop} width={5} height={LH * 2} fill={theme.alt} />
      </g>
      <Arrow x1={R.x + R.w - 20} y1={R.y + 150} x2={E.x + 20} y2={codeTop + LH} color={theme.alt} draw={link} />

      {/* языки */}
      {LANGS.map((l, i) => {
        const x = S2.langs.x + i * (S2.langs.w + S2.langs.gap)
        const on = interpolate(frame, [langAt[i], langAt[i] + 12], [0, 1], clamp)
        return (
          <g key={l.name} opacity={on} transform={`translate(0 ${(1 - on) * 14})`}>
            <Card x={x} y={S2.langs.y} w={S2.langs.w} h={S2.langs.h} stroke={i < 2 ? theme.accent : theme.line}>
              <Label x={x + S2.langs.w / 2} y={S2.langs.y + 36} size={22} weight={700} color={i < 2 ? theme.accent : theme.ink}>
                {l.name}
              </Label>
              <Label x={x + S2.langs.w / 2} y={S2.langs.y + 64} size={18} color={theme.soft} weight={500}>
                {l.note}
              </Label>
            </Card>
          </g>
        )
      })}

      {/* доска 2: файлы и проект */}
      {frame >= b(3) && (
        <Window
          x={T.x}
          y={T.y}
          w={T.w}
          h={T.h}
          at={b(3) + 20}
          bar={
            <>
              <FileGlyph x={18} y={BAR / 2 + 8} folder color={theme.alt} />
              <Mono x={52} y={BAR / 2 + 7} fill={theme.ink}>
                trainer-app
              </Mono>
            </>
          }
        >
          {FILES.map((f, i) => {
            const on = interpolate(frame, [b(3) + 35 + i * 14, b(3) + 45 + i * 14], [0, 1], clamp)
            const x = 24 + f.depth * 32
            const isPkg = f.name === 'package.json'
            const isEnv = f.name === '.env'
            const lit = (isPkg && deps > 0) || (isEnv && frame >= b(6))
            return (
              <g key={f.name} opacity={on}>
                {lit && <rect x={8} y={FILE_Y[i] - 27} width={T.w - 16} height={38} rx={6} fill={isEnv ? theme.riskTint : theme.altTint} />}
                <FileGlyph x={x} y={FILE_Y[i]} folder={f.folder} color={isEnv && lit ? theme.risk : f.folder ? theme.alt : theme.soft} />
                <Mono x={x + 34} y={FILE_Y[i]} size={22} fill={theme.ink}>
                  {f.name}
                </Mono>
              </g>
            )
          })}
        </Window>
      )}
      <g opacity={project}>
        <rect x={T.x} y={T.y + T.h + 14} width={T.w} height={44} rx={22} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} />
        <Label x={T.x + T.w / 2} y={T.y + T.h + 44} size={22} color={theme.accent} weight={700}>
          все файлы вместе — проект
        </Label>
      </g>

      {/* библиотеки — готовые чужие детали; каждая — зависимость */}
      <g opacity={libsHead}>
        <Label x={Lb.x} y={Lb.y - 18} anchor="start" size={22} color={theme.soft} weight={600}>
          библиотеки
          <tspan fill={theme.alt} opacity={depsWord}>
            {' → зависимости'}
          </tspan>
        </Label>
      </g>
      {LIBS.map((t, i) => {
        const on = interpolate(frame, [b(4) + 20 + i * 15, b(4) + 45 + i * 15], [0, 1], clamp)
        const y = Lb.y + i * Lb.step
        const py = T.y + FILE_Y[3] - 8
        return (
          <g key={t}>
            <path d={`M${Lb.x} ${y + Lb.h / 2} C ${Lb.x - 30} ${y + Lb.h / 2}, ${T.x + T.w + 30} ${py}, ${T.x + T.w - 12} ${py}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - deps} fill="none" stroke={theme.alt} strokeWidth={3} />
            <g opacity={on} transform={`translate(${(1 - on) * 160} 0)`}>
              <Parcel x={Lb.x} y={y} w={Lb.w} h={Lb.h} text={t} />
            </g>
          </g>
        )
      })}
      <g opacity={ghost}>
        <Parcel x={Lb.x} y={Lb.y + 3 * Lb.step} w={Lb.w} h={Lb.h} text="ещё одна?" ghost />
        <g opacity={ghostNo}>
          <Mark x={Lb.x + Lb.w - 26} y={Lb.y + 3 * Lb.step + Lb.h / 2} ok={false} />
        </g>
      </g>

      {/* ключи API — в .env, не в чат и не на GitHub */}
      <g opacity={env}>
        <Card x={V.x} y={V.y} w={V.w} h={V.h} stroke={theme.risk}>
          <KeyGlyph x={V.x + 34} y={V.y + 40} color={theme.risk} scale={1.2} />
          <text x={V.x + 84} y={V.y + 50} style={{ font: `700 26px ${theme.mono}` }} fill={theme.ink}>
            .env
          </text>
          <Mono x={V.x + 24} y={V.y + 104} fill={theme.ink}>
            AI_KEY=••••••••
          </Mono>
          <Mono x={V.x + 24} y={V.y + 140} fill={theme.ink}>
            PAY_KEY=••••••
          </Mono>
          <Label x={V.x + 24} y={V.y + 180} anchor="start" size={20} color={theme.risk} weight={600}>
            ключи API — пароли программ
          </Label>
        </Card>
      </g>
      <g opacity={noChat}>
        <rect x={V.x + 60} y={V.y + V.h + 28} width={64} height={44} rx={12} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
        <path d={`M${V.x + 76} ${V.y + V.h + 72} l-6 12 l16 -12`} fill={theme.paper} stroke={theme.line} strokeWidth={3} strokeLinejoin="round" />
        <Mark x={V.x + 124} y={V.y + V.h + 30} ok={false} />
        <Label x={V.x + 92} y={V.y + V.h + 112} size={20} color={theme.risk} weight={600}>
          не в чат
        </Label>
      </g>
      <g opacity={noHub}>
        <Cloud x={V.x + 220} y={V.y + V.h + 22} w={90} h={56} />
        <Mark x={V.x + 312} y={V.y + V.h + 30} ok={false} />
        <Label x={V.x + 265} y={V.y + V.h + 112} size={20} color={theme.risk} weight={600}>
          не на GitHub
        </Label>
      </g>
    </KitScene>
  )
}
