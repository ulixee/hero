
module.exports = {verbose: false,
  testMatch: ['**/test/*.test.js'],
  testEnvironment: 'node',
  collectCoverage: false,
  transform: {},
  testTimeout: 15e3,
  reporters: ['default', ['github-actions', { silent: false }], 'summary'],
};
