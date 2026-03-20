import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    },
    // Kill any individual test that runs longer than 5 seconds
    testTimeout: 5000,
    // Kill any hook (beforeAll, afterAll, etc.) that runs longer than 10 seconds
    hookTimeout: 10000,
    // Bail out of the entire suite after 3 consecutive failures
    bail: 3,
    // Prevent infinite retry loops
    retry: 0,
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
