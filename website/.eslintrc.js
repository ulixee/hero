const { join } = require('path');

module.exports = {
  extends: '../.eslintrc.js',
  parserOptions: {
    project: join(__dirname, '/tsconfig.json'),
  },
  ignorePatterns: ['static', 'node_modules', 'dist', 'build', '**/*.md', '*.js'],
  rules: {
    'no-console': 'off',
  },
};
