const { pathsToModuleNameMapper } = require('ts-jest');
const tsconfig = require('./tsconfig.json');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions?.paths ?? {}, {
    prefix: '<rootDir>/',
  }),
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/dto/**',
    '!src/**/entities/**',
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'json', 'html', 'lcov'],
  verbose: true,
  setupFilesAfterEnv: [],
};

