const { join } = require('path');

module.exports = {
  extends: '../../.eslintrc.js',
  parserOptions: {
    project: join(__dirname, 'tsconfig.json'),
  },
};
