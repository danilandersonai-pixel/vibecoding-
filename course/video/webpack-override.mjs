// Правка сборки Remotion для роликов: `import svg from '…/схема.svg?raw'` отдаёт текст схемы, а не адрес файла.
// Схему книги кадр «Figure» вставляет в разметку как есть — её красит src/styles/figures.css.
// Остальные .svg (без ?raw) собираются, как раньше: файлом.
export function webpackOverride(config) {
  const rules = (config.module?.rules ?? []).map((rule) =>
    rule && typeof rule === 'object' && rule.test instanceof RegExp && rule.test.test('схема.svg') ? { ...rule, resourceQuery: { not: [/raw/] } } : rule,
  )
  return {
    ...config,
    module: {
      ...config.module,
      rules: [{ test: /\.svg$/, resourceQuery: /raw/, type: 'asset/source' }, ...rules],
    },
  }
}
