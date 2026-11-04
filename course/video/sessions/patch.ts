// Применение вывода `git diff` к содержимому одного файла. Без сдвигов и нечёткого поиска:
// каждый блок должен лечь ровно на своё место, иначе — Error('Дифф не ложится: …').

const HUNK = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/

function fail(why: string): never {
  throw new Error(`Дифф не ложится: ${why}`)
}

// Файл как список строк и признак «последняя строка закончена переводом строки».
function splitLines(text: string): { lines: string[]; eol: boolean } {
  if (text === '') return { lines: [], eol: true }
  const eol = text.endsWith('\n')
  return { lines: (eol ? text.slice(0, -1) : text).split('\n'), eol }
}

// before — содержимое до правки (null — файла не было), diff — строки вывода git diff для этого файла.
export function applyPatch(before: string | null, diff: string[]): string {
  const old = splitLines(before ?? '')
  const out: string[] = []
  let eol = old.eol
  let pos = 0 // сколько строк старого файла уже перенесено или заменено

  let i = diff.findIndex((line) => line.startsWith('@@'))
  if (i < 0) i = diff.length
  if (before !== null && diff.slice(0, i).includes('--- /dev/null')) fail('дифф создаёт файл, а он уже есть')

  while (i < diff.length) {
    const header = diff[i]
    const hunk = HUNK.exec(header)
    if (!hunk) fail(`лишняя строка «${header}»`)
    const oldCount = hunk[2] === undefined ? 1 : Number(hunk[2])
    let oldLeft = oldCount
    let newLeft = hunk[4] === undefined ? 1 : Number(hunk[4])
    // у блока без старых строк номер — строка, после которой он вставляется
    const start = oldCount === 0 ? Number(hunk[1]) : Number(hunk[1]) - 1
    if (start < pos || start > old.lines.length) fail(`блок «${header}» не помещается в файл`)
    i++
    for (; pos < start; pos++) out.push(old.lines[pos])

    let last = '' // вид последней строки блока: «+», «-» или пробел
    let oldMark = false // «\ No newline at end of file» у старой последней строки
    let newMark = false // то же у новой
    while (oldLeft > 0 || newLeft > 0 || diff[i]?.startsWith('\\')) {
      const line = diff[i++]
      if (line === undefined) fail(`блок «${header}» оборван`)
      const sign = line[0]
      const text = line.slice(1)
      if (sign === '\\') {
        if (last === '') fail('отметка про конец файла без строки')
        if (last !== '+') oldMark = true
        if (last !== '-') newMark = true
        continue
      }
      if (sign !== ' ' && sign !== '-' && sign !== '+') fail(`непонятная строка «${line}»`)
      if (sign !== '+') {
        if (oldLeft === 0) fail(`в блоке больше старых строк, чем в его заголовке («${line}»)`)
        if (old.lines[pos] !== text) fail(`в строке ${pos + 1} файла «${old.lines[pos] ?? 'конец файла'}», а дифф ждёт «${text}»`)
        pos++
        oldLeft--
      }
      if (sign !== '-') {
        if (newLeft === 0) fail(`в блоке больше новых строк, чем в его заголовке («${line}»)`)
        out.push(text)
        newLeft--
      }
      last = sign
    }

    // перевод строки в конце файла: блок, дошедший до конца, должен говорить о нём ровно то, что есть в файле
    if (pos === old.lines.length) {
      if (oldMark !== !old.eol) fail('перевод строки в конце файла не тот, что в диффе')
      eol = !newMark
    } else if (oldMark || newMark) {
      fail('отметка про конец файла стоит не в конце файла')
    }
  }

  for (; pos < old.lines.length; pos++) out.push(old.lines[pos])
  return out.length === 0 ? '' : out.join('\n') + (eol ? '\n' : '')
}
