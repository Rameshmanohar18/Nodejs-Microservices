module.exports = {
  // Base configuration
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'tests/reports/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test matching patterns
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setup.js'],
  globalSetup: '<rootDir>/tests/setup/globalSetup.js',
  globalTeardown: '<rootDir>/tests/setup/teardown.js',
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/controllers/': {
      branches: 85,
      functions: 90,
      lines: 90
    }
  },
  
  // Module mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Timeout
  testTimeout: 30000,
  
  // Mock configurations
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Reporters
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Flipkart Clone Test Report',
      outputPath: 'tests/reports/test-report.html',
      includeFailureMsg: true
    }],
    ['jest-junit', {
      outputDirectory: 'tests/reports',
      outputName: 'junit.xml'
    }]
  ]
};