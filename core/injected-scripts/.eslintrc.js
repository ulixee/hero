const { join } = require('path');

module.exports = {
  extends: '../../.eslintrc.js',
  parserOptions: {
    project: join(__dirname, 'tsconfig.json'),
  },
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        'max-classes-per-file': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};
