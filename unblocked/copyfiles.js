// eslint-disable-next-line import/no-extraneous-dependencies,import/no-self-import
const copyfiles = require('copyfiles');
const Fs = require('fs');
const Path = require('path');
const pkg = require('./package.json');

const copyToDir = process.env.OUT_DIR;
const isStandardBuild = !copyToDir.includes('dist');

const workspaces = [];
for (const packageGlob of pkg.workspaces.packages) {
  if (packageGlob.startsWith('../') || packageGlob.includes('/build')) continue;

  let workspacePath = packageGlob;
  if (workspacePath.endsWith('/*')) {
    workspacePath = workspacePath.replace('/*', '');
    for (const subdir of Fs.readdirSync(Path.resolve(__dirname, workspacePath))) {
      if (subdir === 'node_modules') continue;
      if (!Fs.statSync(Path.resolve(__dirname, workspacePath, subdir)).isDirectory()) continue;
      if (!Fs.existsSync(Path.resolve(__dirname, workspacePath, subdir, 'package.json'))) continue;
      workspaces.push(`${workspacePath}/${subdir}`);
    }
  } else {
    workspaces.push(workspacePath);
  }
}

const copyArgs = [
  '-e "node_modules"',
  'package*.json',
  'examples/*.js',
  'examples/*.mjs',
  '.*ignore',
];
if (isStandardBuild) {
  copyArgs.push('testing/*/**', 'yarn.lock');
}

for (const workspace of workspaces) {
  if (isStandardBuild) {
    copyArgs.push(`${workspace}/data/**/*`, `${workspace}/test/*/**`);
  }
  copyArgs.push(
    `${workspace}/assets/**/*`,
    `${workspace}/.ulixee/*`,
    `${workspace}/package*.json`,
    `${workspace}/*/*.json`,
    `${workspace}/*/*.html`,
    `${workspace}/*/*.png`,
    `${workspace}/go/*.*`,
    `${workspace}/*.cjs`,
    `${workspace}/*.mjs`,
    `${workspace}/.*ignore`,
    `${workspace}/*.sh`,
  );
}

if (isStandardBuild) copyArgs.push('-a');

copyfiles([...copyArgs, copyToDir], {}, () => {
  // eslint-disable-next-line no-console
  console.log('Files Copied');
});
