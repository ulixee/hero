#!/bin/bash

for repo in "specifications" "real-user-agents" "agent" "double-agent"
do
  yarn version:check
  cd "$repo"
  echo "Bump Repo Version: $repo at $PWD"
  git add .
  npx ulx-repo-version-bump $1
  yarn build:dist
  cd ..
done

npx ulx-repo-version-bump $1
yarn build:all
yarn build:dist
