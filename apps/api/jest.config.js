/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@clipforge/core$': '<rootDir>/../../packages/core/src/index.ts',
    '^@clipforge/db$': '<rootDir>/../../packages/db/src/index.ts',
    '^@clipforge/types$': '<rootDir>/../../packages/types/src/index.ts',
  },
};
