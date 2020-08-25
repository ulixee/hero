const fs = require('fs');
const buildDistDir = `${__dirname}/build-dist`;

const rootPackageJson = require('./package.json');

const defaults = {
  repository: rootPackageJson.repository,
  license: rootPackageJson.license,
  bugs: rootPackageJson.bugs,
  author: rootPackageJson.author,
  contributors: rootPackageJson.contributors,
  homepage: rootPackageJson.homepage,
  engines: {
    node: '>=12.0.0',
  },
  publishConfig: {
    access: 'public',
  },
};

const licensePath = `${__dirname}/LICENSE.md`;
const readmePath = `${__dirname}/README.md`;

function processPackageJson(packagePath) {
  const packageJson = JSON.parse(fs.readFileSync(`${packagePath}/package.json`, 'utf8'));
  let overridesJson = {};
  if (fs.existsSync(`${packagePath}/package.dist.json`)) {
    overridesJson = JSON.parse(fs.readFileSync(`${packagePath}/package.dist.json`, 'utf8'));
    console.log('Has package.json overrides', packagePath, overridesJson);
    fs.unlinkSync(`${packagePath}/package.dist.json`);
  }

  if (packageJson.private) {
    console.log('Private package, skipping', packagePath);
    return;
  }
  fs.copyFileSync(licensePath, `${packagePath}/LICENSE.md`);
  const finalPackageJson = {
    name: overridesJson.name || packageJson.name,
    version: overridesJson.version || packageJson.version,
    description: overridesJson.description || packageJson.description,
    main: overridesJson.main || packageJson.main,
    types: overridesJson.types || packageJson.types,
    files: overridesJson.files || packageJson.files,
    ...defaults,
    scripts: overridesJson.scripts,
    dependencies: overridesJson.dependencies || packageJson.dependencies,
    engine: packageJson.engine, // this is used by emulators
  };

  // check if index exists
  if (!finalPackageJson.files && !finalPackageJson.main) {
    if (fs.existsSync(`${packagePath}/index.js`)) {
      finalPackageJson.main = 'index.js';
    }
  }
  if (finalPackageJson.main && !finalPackageJson.types) {
    finalPackageJson.types = finalPackageJson.main.replace('.js', '.d.ts');
  }

  if (finalPackageJson.name === 'secret-agent') {
    fs.copyFileSync(readmePath, `${packagePath}/README.md`);
  }

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

processDir(buildDistDir);
