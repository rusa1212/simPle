import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const sharedDir = fileURLToPath(new URL('../shared', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@game': `${sharedDir}/game/index.ts`,
    },
  },
  server: {
    // client 폴더 밖의 shared 모듈을 개발 서버에서 읽을 수 있게 허용
    fs: {
      allow: ['.', sharedDir],
    },
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
