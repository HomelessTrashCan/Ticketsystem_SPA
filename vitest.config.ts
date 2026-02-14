import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000, // 10 seconds for API tests
    hookTimeout: 10000,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.js'],
    exclude: ['tests/k6.test.js'], // k6 tests must be run with k6 CLI
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/server/seed.mjs',
        'src/server/mongo-connection.mjs',
        '**/*.config.*',
      ],
    },
  },
});
