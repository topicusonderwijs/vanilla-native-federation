module.exports = {
  verbose: true,
  rootDir: '.',
  roots: ['<rootDir>/src'],
  coverageReporters: ["html", "text"],
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
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },  
  coverageDirectory: 'coverage',

  collectCoverageFrom: [
    'src/lib/**/*.{js,ts}',
    '!src/lib/**/*.d.ts',
    '!src/lib/**/*index.ts',
    '!src/lib/5.di/**/*',
    '!src/lib/6.mocks/**/*',
  ],
  preset: 'ts-jest',
  clearMocks: true
};