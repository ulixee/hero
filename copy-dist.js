// eslint-disable-next-line import/no-extraneous-dependencies
const copyfiles = require('copyfiles');

copyfiles(
  [
    '-e "node_modules/**"',
    '-e "**/node_modules/**"',
    '-e "build/**"',
    '-e "build-dist/**"',
    '-e "mitm-socket/dist"',
    '*client/index.mjs',
    'emulate-browsers/**/data/**',
    'emulate-browsers/**/data/config.json',
    'mitm-socket/lib/*',
    '**/.gitignore',
    '**/.npmignore',
    'build-dist',
  ],
  {},
  () => {
    // eslint-disable-next-line no-console
    console.log('Files Copied');
  },
);
