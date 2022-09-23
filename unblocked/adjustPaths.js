const fs = require('fs');
const path = require('path');

let relativeDirectory = process.argv[2] || '/build';
const isDist = relativeDirectory.includes('build-dist');
// eslint-disable-next-line no-console
console.log('Updating paths relative to %s', relativeDirectory);
if (!relativeDirectory.startsWith('/')) relativeDirectory = `/${relativeDirectory}`;

function processDir(dir) {
  for (const fileOrDir of fs.readdirSync(dir)) {
    if (fileOrDir === 'node_modules' || fileOrDir.startsWith('.')) continue;

    const fullpath = `${dir}/${fileOrDir}`;
    const stat = fs.lstatSync(fullpath);
    if (stat.isDirectory()) {
      processDir(fullpath);
    } else if (stat.isFile() && isDist && fileOrDir === 'paths.dist.json') {
      fs.copyFileSync(fullpath, fullpath.replace('paths.dist.json', 'paths.json'));
      fs.unlinkSync(fullpath);
    } else if (stat.isFile() && !isDist && fileOrDir === 'paths.json') {
      const pathsJson = JSON.parse(fs.readFileSync(fullpath, 'utf8'));
      if (pathsJson.__modified__) continue;

      for (const [key, value] of Object.entries(pathsJson)) {
        const sourceDir = path.resolve(dir.replace(relativeDirectory, ''));
        const relative = path.relative(dir, sourceDir);
        const relativePath = path.join(dir, relative, value);
        if (fs.existsSync(relativePath)) {
          pathsJson[key] = path.join(relative, value);
          // eslint-disable-next-line no-console
          console.log('Updating relative path from %s to %s', value, pathsJson[key]);
        } else {
          // eslint-disable-next-line no-console
          console.log('Could not adjust relative path in paths.json', {
            path: value,
            attemptedPath: pathsJson[key],
            sourceFile: fullpath,
          });
        }
      }
      pathsJson.__modified__ = new Date();
      fs.writeFileSync(fullpath, JSON.stringify(pathsJson, null, 2));
    }
  }
}

processDir(`${__dirname}${relativeDirectory}`);
