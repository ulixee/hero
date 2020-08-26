const fs = require('fs');

const buildDir = `${__dirname}/build`;

function processPackageJson(packagePath) {
  const packageJson = JSON.parse(fs.readFileSync(`${packagePath}/package.json`, 'utf8'));
  let overridesJson = {};
  if (fs.existsSync(`${packagePath}/package.build.json`)) {
    overridesJson = JSON.parse(fs.readFileSync(`${packagePath}/package.build.json`, 'utf8'));
    console.log('Has package.json overrides', packagePath, overridesJson);
    fs.unlinkSync(`${packagePath}/package.build.json`);
  }

  if (!overridesJson) return;

  const finalPackageJson = {
    ...packageJson,
    name: overridesJson.name || packageJson.name,
    scripts: overridesJson.scripts,
    dependencies: overridesJson.dependencies || packageJson.dependencies,
    devDependencies: overridesJson.devDependencies || packageJson.devDependencies,
    workspaces: overridesJson.workspaces || packageJson.workspaces,
  };

  console.log('writing', `${packagePath}/package.json`);
  fs.writeFileSync(`${packagePath}/package.json`, JSON.stringify(finalPackageJson, null, 2));
}

function processDir(path) {
  for (const dirname of fs.readdirSync(path)) {
    if (dirname === 'node_modules' || dirname.startsWith('.')) continue;
    const fullpath = `${path}/${dirname}`;
    if (fs.existsSync(`${fullpath}/package.json`)) {
      processPackageJson(fullpath);
    }
    if (fs.lstatSync(fullpath).isDirectory()) {
      processDir(fullpath);
    }
  }
}

processDir(buildDir);
