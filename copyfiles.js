// eslint-disable-next-line import/no-extraneous-dependencies,import/no-self-import
const copyfiles = require('copyfiles');
const Fs = require('fs');
const pkg = require('./package.json');

const copyToDir = process.env.OUT_DIR;
const isBuild = copyToDir === 'build';
const workspaces = pkg.workspaces.packages.map(x => x.replace('/*', ''));

const copyArgs = [
  '-e "node_modules"',
  'plugins/default-browser-emulator/data/**',
  'examples/*.js',
  'examples/*.mjs',
  'mitm-socket/go/*.*',
  '.*ignore',
];
if (isBuild) {
  copyArgs.push('testing/*/**', 'core/test/html/**', 'puppet/test/*/**', 'yarn.lock');
}

for (const workspace of workspaces) {
  copyArgs.push(
    `${workspace}/*.cjs`,
    `${workspace}/*.mjs`,
    `${workspace}/**/.*ignore`,
    `${workspace}/**/*.sh`,
  );
}

if (isBuild) copyArgs.push('-a');

copyfiles([...copyArgs, copyToDir], {}, () => {
  if (isBuild) {
    Fs.copyFileSync(`${__dirname}/package.build.json`, `${__dirname}/build/package.json`);
  }
  // eslint-disable-next-line no-console
  console.log('Files Copied');
});
