const { monorepo } = require('@ulixee/repo-tools/eslint');

module.exports = monorepo(__dirname);
module.exports.ignorePatterns.push('DomExtractor.js');
module.exports.overrides.push({
  files: ['browser-profiler/**/*', 'double-agent-stacks/**/*'],
  rules: { 'no-console': 'off' },
});
module.exports.rules = {
  ...module.exports.rules,
  'no-unused-vars': 'off',
  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: 'variable',
      format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
      leadingUnderscore: 'allow',
    },
  ],
  '@typescript-eslint/no-unused-vars': [
    'warn',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
};
