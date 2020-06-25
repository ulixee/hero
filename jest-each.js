const path = require('path');
const rimraf = require('rimraf');

const cacheDir = path.resolve(__dirname, '.cache-test');

global.afterAll(() => {
  rimraf.sync(cacheDir);
});
