// eslint-disable-next-line import/no-extraneous-dependencies
const copyfiles = require('copyfiles');

void (async () => {
  await new Promise(resolve => {
    copyfiles(
      [
        '-e "node_modules"',
        'browser-profiler/main/chrome-docker/*',
        'browser-profiler/main/chrome-docker/.dockerignore',
        'browser-profiler/.env*',
        '-a',
        `${__dirname}/build`,
      ],
      {},
      () => {
        // eslint-disable-next-line no-console
        console.log('Extra Files Copied');
        resolve();
      },
    );
  });
})();
