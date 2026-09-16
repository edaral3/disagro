import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // .next/standalone contiene su propio package.json (build de Docker),
  // que Jest confunde con un módulo homónimo del proyecto.
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
};

export default createJestConfig(config);
