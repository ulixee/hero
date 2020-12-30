// eslint-disable-next-line import/no-extraneous-dependencies
const copyfiles = require('copyfiles');

copyfiles(
  [
    '-e "node_modules/**"',
    '-e "build/**"',
    '-e "build-dist/**"',
    '-e "mitm-socket/dist"',
    'emulate-browsers/**/data/**',
    'injected-scripts/package.json',
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
