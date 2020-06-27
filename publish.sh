lerna version premajor --conventional-commits --create-release=github --no-push
yarn build:dist
cd build-dist/
npx lerna publish from-package
