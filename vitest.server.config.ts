import { config as loadDotenv } from 'dotenv'
import { defineConfig } from 'vitest/config'

loadDotenv()

export default defineConfig({
  test: {
    include: ['server/tests/**/*.{test,spec}.ts'],
    environment: 'node',
    globals: true,
  },
})
