import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    setupFiles: ['./src/test-setup.js']
  },
  esbuild: {
    target: 'es2022'
  }
});