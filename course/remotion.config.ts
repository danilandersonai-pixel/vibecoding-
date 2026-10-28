import { Config } from '@remotion/cli/config'
import { webpackOverride } from './video/webpack-override.mjs'

// Общая настройка сборки роликов: схемы книги импортируются текстом (`…svg?raw`).
Config.overrideWebpackConfig(webpackOverride)
