PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

cd dist

mkdir -p assets


if [ -d "./linux-unpacked" ]; then
  echo "Packing linux"
  mv linux-unpacked "replay-${PACKAGE_VERSION}-linux"
fi

if [ -d "./win-unpacked" ]; then
  echo "Packing windows"
  mv win-unpacked "replay-${PACKAGE_VERSION}-win"
fi
