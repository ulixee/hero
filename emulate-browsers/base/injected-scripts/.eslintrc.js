const { join } = require('path');

module.exports = {
  extends: '../../../.eslintrc.js',
  parserOptions: {
    project: join(__dirname, '/tsconfig.json'),
  },
  rules: {
    'no-console': 'off',
    'no-undef': 'off',
    'prefer-rest-params': 'off',
    'max-classes-per-file': 'off',
    'func-names': 'off',
    'no-restricted-globals': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'prefer-arrow-callback': 'off',
  },
};
