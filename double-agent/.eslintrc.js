// eslint-disable-next-line import/no-extraneous-dependencies
const { monorepo } = require('@ulixee/repo-tools/eslint');

module.exports = monorepo(__dirname);
module.exports.overrides.push(
  {
    files: ['**/*.ts'],
    rules: {
      'no-console': 'off',
      'require-await': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['**/plugins/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    files: ['DomExtractor.js'],
    rules: {
      'no-restricted-globals': 'off',
      'prefer-promise-reject-errors': 'off',
      'new-cap': 'off',
    },
  },
);

module.exports.ignorePatterns.push('probe-data');
