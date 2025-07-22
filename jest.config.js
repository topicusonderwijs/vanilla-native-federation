module.exports = {
  verbose: true,
  rootDir: '.',
  roots: ['<rootDir>/src'],
  coverageReporters: ["json-summary"],
  testEnvironment: 'jsdom',
  testMatch: [
      '**/*.spec.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      babel: true,
      tsconfig: 'tsconfig.json',
    }]
  },
  moduleNameMapper: {
    "^lib/(.*)$": ["<rootDir>/src/lib/$1"],
  },
  setupFiles: [],

  collectCoverage: true,

  coverageDirectory: 'coverage',

  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/lib/5.di/**/*',
  ],
  preset: 'ts-jest',
  clearMocks: true
};