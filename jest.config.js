module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
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

  setupFiles: [],

  collectCoverage: true,

  coverageDirectory: 'coverage',

  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  preset: 'ts-jest',
  clearMocks: true
};