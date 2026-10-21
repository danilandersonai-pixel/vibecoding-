import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' — сборка открывается из любой папки и публикуется как страница Claude
export default defineConfig({
  base: './',
  plugins: [react()],
})
