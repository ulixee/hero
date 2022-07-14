yarn version:bump
yarn build:dist
cd build-dist/
npx lerna publish from-package
