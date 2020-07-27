PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

cd dist

cd mac
tar -czf "../replay-${PACKAGE_VERSION}-mac.tar.gz" SecretAgentReplay.app
cd ..

mv linux-unpacked "replay-${PACKAGE_VERSION}-linux"
tar -czf "replay-${PACKAGE_VERSION}-linux.tar.gz" "replay-${PACKAGE_VERSION}-linux"

mv win-unpacked "replay-${PACKAGE_VERSION}-win"
tar -czf "replay-${PACKAGE_VERSION}-win.tar.gz" "replay-${PACKAGE_VERSION}-win"
