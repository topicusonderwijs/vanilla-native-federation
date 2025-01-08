module.exports = {
    verbose: true,
    rootDir: '.',
    roots: ['<rootDir>/src'],
    testEnvironment: 'node',
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
      '!src/**/*.d.ts'
    ],
    preset: 'ts-jest',
    clearMocks: true
  };