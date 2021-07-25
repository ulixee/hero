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
    node: '>=13.2.0',
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
    exports: overridesJson.exports || packageJson.exports,
    files: overridesJson.files || packageJson.files,
    ...defaults,
    scripts: overridesJson.scripts,
    dependencies: overridesJson.dependencies || packageJson.dependencies,
    bin: packageJson.bin,
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

  if (finalPackageJson.name === '@ulixee/hero') {
    fs.copyFileSync(readmePath, `${packagePath}/README.md`);
  }

  console.log('writing', `${packagePath}/package.json`);
  fs.writeFileSync(`${packagePath}/package.json`, JSON.stringify(finalPackageJson, null, 2));
}

function processDir(path) {
  for (const fileOrDir of fs.readdirSync(path)) {
    if (fileOrDir === 'node_modules' || fileOrDir.startsWith('.')) continue;

    const fullpath = `${path}/${fileOrDir}`;
    if (fs.lstatSync(fullpath).isDirectory()) {
      processDir(fullpath);
    } else if (fileOrDir === 'package.json') {
      processPackageJson(path);
    }
  }
}

processDir(buildDistDir);
