import '@fontsource-variable/golos-text'
import '@fontsource-variable/martian-mono'
import '../src/styles/tokens.css'
import '../src/styles/figures.css'
import { registerRoot } from 'remotion'
import { Root } from './Root'

// Шрифты набора «Репозиторий» (Golos Text, Martian Mono), токены курса и стили схем книги (figures.css красит схемы через токены).
registerRoot(Root)
