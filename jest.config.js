module.exports = {
  verbose: true,
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  testMatch: [
      '**/*.spec.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      babel: true,
      tsconfig: 'tsconfig.json',
    }]
  },

  setupFiles: [],

  collectCoverage: true,

  coverageDirectory: 'coverage',

  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.resolver.ts',
  ],
  preset: 'ts-jest',
  clearMocks: true
};