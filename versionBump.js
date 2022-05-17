const { writeFileSync, readFileSync } = require('fs');
const { spawn } = require('child_process');

const pkgJson = readFileSync('./package.json', 'utf-8');
const modified = JSON.parse(pkgJson);
modified.workspaces.packages = modified.workspaces.packages.filter(x => !x.startsWith('..'));

(async () => {
  try {
    console.log('Removing external workspaces from package.json');
    writeFileSync(`${__dirname}/package.json`, JSON.stringify(modified, null, 2));
    const child = spawn(
      `lerna`,
      [
        'version',
        process.argv[2],
        '--conventional-commits',
        '--no-push',
        '--exact',
        '--force-publish',
      ],
      { cwd: process.cwd(), stdio: ['inherit', 'inherit', 'inherit', 'inherit'] },
    );
    await new Promise((resolve, reject) => {
      child.once('close', resolve);
      child.once('exit', resolve);
      child.once('error', reject);
    });
  } finally {
    console.log('Restoring Package.json');
    writeFileSync(`${__dirname}/package.json`, pkgJson);
  }
})();
