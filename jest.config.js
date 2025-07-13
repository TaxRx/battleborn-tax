export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/lib/supabase$': '<rootDir>/src/tests/__mocks__/supabase.ts',
  },
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/testEnv.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/tests/**',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
}; 