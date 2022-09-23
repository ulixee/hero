const fs = require('fs');

const packageJson = require('./package.json');

if (process.argv[2] === 'pre') {
  if (!packageJson.workspaces['packages:postworkspaces']) {
    packageJson.workspaces['packages:postworkspaces'] = packageJson.workspaces.packages;
    packageJson.workspaces.packages = packageJson.workspaces['packages:preworkspaces'];
  }
} else if (packageJson.workspaces['packages:postworkspaces']) {
  packageJson.workspaces.packages = packageJson.workspaces['packages:postworkspaces'];
  delete packageJson.workspaces['packages:postworkspaces'];
}
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
