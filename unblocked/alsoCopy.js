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
        'double-agent/collect/certs/*',
        'double-agent/**/.env*',
        'agent/testing/certs/*.pem',
        ".yarn/*",
        ".yarnrc.yml",
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
