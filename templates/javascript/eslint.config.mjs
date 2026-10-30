import js from '@eslint/js';
import cypress from 'eslint-plugin-cypress';

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

export default [
  {
    ignores: ['node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['cypress/**/*.js', 'cypress.config.js'],
    languageOptions: {
      globals: {
        ...cypressGlobals,
        module: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      cypress,
    },
    rules: {
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
    },
  },
];
