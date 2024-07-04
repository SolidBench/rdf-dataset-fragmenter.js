module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$',
  ],
  testRegex: '(/test/.*|(\\.|/)(test|spec))\\.ts$',
  moduleFileExtensions: [
    'ts',
    'js',
  ],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
