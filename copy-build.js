// eslint-disable-next-line import/no-extraneous-dependencies
const copyfiles = require('copyfiles');
const Fs = require('fs');

copyfiles(
  [
    'emulate-browsers/**/data/**',
    'testing/*/**',
    'examples/*.mjs',
    '*client/index.mjs',
    'puppet/test/*/**',
    'yarn.lock',
    'mitm-socket/dist/*',
    '-a',
    'build',
  ],
  {},
  () => {
    Fs.copyFileSync(`${__dirname}/package.build.json`, `${__dirname}/build/package.json`);

    // eslint-disable-next-line no-console
    console.log('Files Copied');
  },
);
