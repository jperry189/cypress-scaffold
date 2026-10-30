import js from '@eslint/js';
import cypress from 'eslint-plugin-cypress';
import tseslint from 'typescript-eslint';

const cypressGlobals = {
  after: 'readonly',
  afterEach: 'readonly',
  assert: 'readonly',
  before: 'readonly',
  beforeEach: 'readonly',
  context: 'readonly',
  Cypress: 'readonly',
  cy: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  specify: 'readonly',
};

export default tseslint.config(
  {
    ignores: ['node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      'no-undef': 'off',
    },
  },
  {
    files: ['cypress/**/*.ts', 'cypress.config.ts'],
    languageOptions: {
      globals: cypressGlobals,
    },
    plugins: {
      cypress,
    },
    rules: {
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
    },
  }
);
