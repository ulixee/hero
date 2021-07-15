PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

cd dist

mkdir -p assets

if [ -d "./mac" ]; then
  cd mac
  echo "Packing mac"
  tar -czf "../assets/replay-${PACKAGE_VERSION}-mac.tar.gz" UlixeeReplay.app
  cd ..
fi

if [ -d "./mac-arm64" ]; then
  cd "mac-arm64"
  echo "Packing mac-arm64"
  tar -czf "../assets/replay-${PACKAGE_VERSION}-mac-arm64.tar.gz" UlixeeReplay.app
  cd ..
fi

if [ -d "./linux-unpacked" ]; then
  echo "Packing linux"
  mv linux-unpacked "replay-${PACKAGE_VERSION}-linux"
  tar -czf "assets/replay-${PACKAGE_VERSION}-linux.tar.gz" "replay-${PACKAGE_VERSION}-linux"
fi

if [ -d "./win-unpacked" ]; then
  echo "Packing windows"
  mv win-unpacked "replay-${PACKAGE_VERSION}-win"
  tar -czf "assets/replay-${PACKAGE_VERSION}-win.tar.gz" "replay-${PACKAGE_VERSION}-win"
fi
