// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable global-require, import/no-dynamic-require */
import * as Fs from 'fs';
import * as Path from 'path';

const shouldFix = process.argv[2] === 'fix';
const pkgPaths: Set<string> = new Set();
const submodules = ['desktop', 'chrome-alive', 'commons', 'databox', 'docs', 'hero', 'runner', 'server', 'website'];

recursivelyFindPackageFiles(Path.resolve(__dirname, 'package.json'));

for (const submodule of submodules) {
  recursivelyFindPackageFiles(Path.resolve(__dirname, submodule, 'package.json'));
}

const pkgVersionByName: { [name: string]: string } = {};

for (const pkgPath of Array.from(pkgPaths)) {
  const pkg = require(pkgPath);
  pkgVersionByName[pkg.name] = pkg.version;
  if (!pkg.version) {
    console.log(`MISSING version ${pkg.name}`);
  }
}

for (const pkgPath of Array.from(pkgPaths)) {
  const pkg = require(pkgPath);
  checkDependencies('dependency', pkg?.dependencies, pkgPath);
  checkDependencies('devDependency', pkg?.devDependencies, pkgPath);
  Fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}


// HELPERS /////////////////////////////////////////////////////////////////////////////////////////////////////////////

function checkDependencies(type: 'dependency' | 'devDependency', dependencies, pkgPath) {
  for (const [name, version] of Object.entries(dependencies || {})) {
    const versionToBe = pkgVersionByName[name];
    if (versionToBe && versionToBe !== version) {
      if (shouldFix) {
        dependencies[name] = versionToBe;
        console.log(`UPGRADED ${name} from ${version} to ${versionToBe}: ${pkgPath}`);
      } else {
        console.log(`MISMATCHED dependency version for ${name} (${version} should be ${versionToBe}): ${pkgPath}`);
      }
    }
  }
}

function recursivelyFindPackageFiles(pkgPath: string) {
  if (!Fs.existsSync(pkgPath)) return;
  const pkg = require(pkgPath);
  const pkgDir = Path.dirname(pkgPath);
  const workspaces = pkg.workspaces?.packages?.filter(x => !x.startsWith('../')) || [];
  for (const workspace of workspaces) {
    if (workspace.includes('/**')) {
      const workspaceDir = workspace.replace('/**', '');
      const subWorkspaces = Fs.readdirSync(Path.resolve(pkgDir, workspaceDir));
      for (const subWorkspace of subWorkspaces) {
        const newPkgPath = Path.resolve(pkgDir, workspaceDir, subWorkspace, 'package.json');
        if (Fs.existsSync(newPkgPath)) {
          recursivelyFindPackageFiles(newPkgPath);
          pkgPaths.add(newPkgPath);
        }
      }
    } else {
      const newPkgPath = Path.resolve(pkgDir, workspace, 'package.json');
      if (Fs.existsSync(newPkgPath)) {
        recursivelyFindPackageFiles(newPkgPath);
        pkgPaths.add(newPkgPath);
      }
    }
  }
}

