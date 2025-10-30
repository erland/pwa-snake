// jest.config.mjs (ESM-friendly Jest config with ts-jest)
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json',
        useESM: true
      }
    ]
  },
  extensionsToTreatAsEsm: ['.ts'],
  // Helps when TS compiles to extensionless imports but Jest expects .js in ESM
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: ['src/game/**/*.ts']
};
