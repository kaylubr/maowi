import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: ['../..'],
    },
  },
  test: {
    environment: 'jsdom',
    env: { NODE_ENV: 'test' },
    setupFiles: ['./vitest.setup.ts'],
    include: ['../../tests/ui/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
