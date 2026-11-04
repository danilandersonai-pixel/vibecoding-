import { expect, test } from 'vitest'
import { gitBlobHash } from './blob'
import { applyPatch } from './patch'

test('новый файл', () => {
  expect(applyPatch(null, ['diff --git a/a.txt b/a.txt', 'new file mode 100644', 'index 0000000..b4a6d2e', '--- /dev/null', '+++ b/a.txt', '@@ -0,0 +1,2 @@', '+one', '+two'])).toBe('one\ntwo\n')
})
test('правка с контекстом', () => {
  expect(applyPatch('a\nb\nc\n', ['diff --git a/x b/x', 'index 1..2 100644', '--- a/x', '+++ b/x', '@@ -1,3 +1,3 @@', ' a', '-b', '+B', ' c'])).toBe('a\nB\nc\n')
})
test('файл без перевода строки в конце', () => {
  expect(applyPatch('a\n', ['--- a/x', '+++ b/x', '@@ -1 +1 @@', '-a', '+b', '\\ No newline at end of file'])).toBe('b')
})
test('контекст не совпал — ошибка', () => {
  expect(() => applyPatch('z\n', ['--- a/x', '+++ b/x', '@@ -1 +1 @@', '-a', '+b'])).toThrow('Дифф не ложится')
})
test('хеш как у git', () => {
  expect(gitBlobHash('hello\n')).toBe('ce013625030ba8dba906f756967f9e9ca394464a')
  expect(gitBlobHash('')).toBe('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391')
})

test('хеш считается по байтам: кириллица и Uint8Array', () => {
  expect(gitBlobHash('привет\n')).toBe('d0f56e135b2282bfdd87b1cae5d0238b6a193ab5')
  expect(gitBlobHash(new Uint8Array([104, 101, 108, 108, 111, 10]))).toBe(gitBlobHash('hello\n'))
})

test('несколько блоков: строки между ними и после остаются как были', () => {
  const before = '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12\n'
  const diff = ['--- a/x', '+++ b/x', '@@ -1,2 +1,2 @@', '-1', '+один', ' 2', '@@ -10,3 +10,3 @@', ' 10', '-11', '+одиннадцать', ' 12']
  expect(applyPatch(before, diff)).toBe('один\n2\n3\n4\n5\n6\n7\n8\n9\n10\nодиннадцать\n12\n')
})
test('вставка без контекста', () => {
  expect(applyPatch('a\n', ['--- a/x', '+++ b/x', '@@ -1,0 +2 @@', '+b'])).toBe('a\nb\n')
})
test('удаление всех строк даёт пустой файл', () => {
  expect(applyPatch('a\nb\n', ['--- a/x', '+++ b/x', '@@ -1,2 +0,0 @@', '-a', '-b'])).toBe('')
})
test('пустой файл: блоков нет', () => {
  expect(applyPatch(null, ['diff --git a/e b/e', 'new file mode 100644', 'index 0000000..e69de29'])).toBe('')
})
test('пустая строка в файле', () => {
  expect(applyPatch('a\n\nb\n', ['--- a/x', '+++ b/x', '@@ -1,3 +1,3 @@', ' a', '-', '+c', ' b'])).toBe('a\nc\nb\n')
  expect(applyPatch('a\nb\n', ['--- a/x', '+++ b/x', '@@ -1,2 +1,3 @@', ' a', '+', ' b'])).toBe('a\n\nb\n')
})

test('без перевода строки: с обеих сторон, с контекстом', () => {
  const diff = ['--- a/x', '+++ b/x', '@@ -1,2 +1,2 @@', ' x', '-a', '\\ No newline at end of file', '+b', '\\ No newline at end of file']
  expect(applyPatch('x\na', diff)).toBe('x\nb')
})
test('без перевода строки: в новом он появился', () => {
  expect(applyPatch('a', ['--- a/x', '+++ b/x', '@@ -1 +1 @@', '-a', '\\ No newline at end of file', '+a'])).toBe('a\n')
})
test('без перевода строки: правка выше последней строки его не меняет', () => {
  const diff = ['--- a/x', '+++ b/x', '@@ -1,2 +1,2 @@', '-a', '+A', ' b', '\\ No newline at end of file']
  expect(applyPatch('a\nb', diff)).toBe('A\nb')
  const far = ['--- a/x', '+++ b/x', '@@ -1,2 +1,2 @@', '-a', '+A', ' b']
  expect(applyPatch('a\nb\nc\nd\ne\nf', far)).toBe('A\nb\nc\nd\ne\nf')
})

test('дифф нового файла не ложится на существующий', () => {
  expect(() => applyPatch('a\n', ['--- /dev/null', '+++ b/a', '@@ -0,0 +1 @@', '+b'])).toThrow('Дифф не ложится')
})
test('блок за концом файла — ошибка', () => {
  expect(() => applyPatch('a\n', ['--- a/x', '+++ b/x', '@@ -2 +2 @@', '-b', '+c'])).toThrow('Дифф не ложится')
})
test('обрыв диффа — ошибка', () => {
  expect(() => applyPatch('a\nb\n', ['--- a/x', '+++ b/x', '@@ -1,2 +1,2 @@', ' a'])).toThrow('Дифф не ложится')
})
test('чужая строка внутри блока — ошибка', () => {
  expect(() => applyPatch('a\n', ['--- a/x', '+++ b/x', '@@ -1 +1 @@', '?a'])).toThrow('Дифф не ложится')
})
test('в файле нет перевода строки, а дифф про него молчит — ошибка', () => {
  expect(() => applyPatch('a', ['--- a/x', '+++ b/x', '@@ -1 +1 @@', '-a', '+b'])).toThrow('Дифф не ложится')
})
