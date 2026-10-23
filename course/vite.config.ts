import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { checkContent } from './content-check'

// Сборка и dev-сервер останавливаются с понятной ошибкой, если в файлах дней опечатка.
function contentCheck(): Plugin {
  return {
    name: 'course-content-check',
    buildStart() {
      const errors = checkContent(resolve(__dirname, 'content'))
      if (errors.length) this.error(`Ошибки в содержании курса:\n${errors.join('\n')}`)
    },
  }
}

export default defineConfig({ base: './', plugins: [react(), contentCheck()] })
