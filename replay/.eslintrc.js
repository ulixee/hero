const { join } = require('path');

module.exports = {
  extends: '../.eslintrc.js',
  parserOptions: {
    project: join(__dirname, '/tsconfig.json'),
  },
  ignorePatterns: [
    '**/*.md',
    '**/node_modules',
    'node_modules',
    'build',
    'build-dist',
    '**/.temp',
    'babel.config.js',
    'vue.config.js',
  ],
  rules: {
    'no-console': 'off',
    'import/extensions': 'off',
  },
};
