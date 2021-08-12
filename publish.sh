yarn bump-version
yarn build:dist
cd build-dist/
npx lerna publish from-package
