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

function processPackageJson(packagePath) {
  const packageJson = JSON.parse(fs.readFileSync(`${packagePath}/package.json`, 'utf8'));
  const readmePath = `${packagePath}/README.md`;
  let overridesJson = {};
  if (fs.existsSync(`${packagePath}/package.dist.json`)) {
    overridesJson = JSON.parse(fs.readFileSync(`${packagePath}/package.dist.json`, 'utf8'));
    console.log('Has package.json overrides', packagePath, overridesJson);
    fs.unlinkSync(`${packagePath}/package.dist.json`);
  }

  fs.copyFileSync(licensePath, `${packagePath}/LICENSE.md`);
  if (fs.existsSync(readmePath)) fs.copyFileSync(readmePath, `${packagePath}/README.md`);

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

  if (overridesJson.private === false) {
    delete finalPackageJson.private;
  } else if (packageJson.private) {
    if (!packageJson.workspaces) return;
    finalPackageJson.private = true;
    finalPackageJson.publishConfig = undefined;
    finalPackageJson.workspaces = overridesJson.workspaces ?? packageJson.workspaces;
    finalPackageJson.workspaces.packages = finalPackageJson.workspaces.packages.map(x => {
      if (x.startsWith('../') && !fs.existsSync(`${buildDistDir}/${x.replace('/*', '')}`)) {
        return `../${x}`;
      }
      if (x.includes('/build') && !fs.existsSync(`${buildDistDir}/${x.replace('/*', '')}`)) {
        return `../${x}`;
      }
      return x;
    });
  }

  // check if index exists
  if (!finalPackageJson.files && !finalPackageJson.main) {
    if (fs.existsSync(`${packagePath}/index.js`)) {
      finalPackageJson.main = 'index.js';
    }
  }
  if (finalPackageJson.main && !finalPackageJson.types) {
    finalPackageJson.types = finalPackageJson.main.replace('.js', '.d.ts');
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
