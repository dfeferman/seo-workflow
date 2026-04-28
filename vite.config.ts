import { config as loadDotenv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

// Vitest lädt Module vor Test-Dateien; .env muss vor Import von server/db.ts gesetzt sein.
loadDotenv()
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Muss mit Express `server/index.ts` übereinstimmen (gleiches PORT in .env oder beide Default 3003). */
const apiPort = process.env.PORT?.trim() || '3003'

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/utils/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
})
