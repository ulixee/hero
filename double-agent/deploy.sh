#!/usr/bin/env bash

CURRENT_DIR=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
SERVER_PEM="$HOME/.ssh/id_rsa_ulixee_digital_ocean"

#cleanupOnExit() {
#  printf "\n\nClosing node processes..."
#  ssh -i "$SERVER_PEM" "root@$REMOTE" "source \"\$HOME/.nvm/nvm.sh\" && pm2 stop da"
#  printf "done!\n\n"
#}
#
#trap cleanupOnExit EXIT

rsync -avzhm -e "ssh -i $SERVER_PEM" --exclude-from '.rsyncignore' . root@$REMOTE:~/double-agent

echo "-- REMOTE SCRIPT ---------------------------------------------------------------"
ssh -i "$SERVER_PEM" "root@$REMOTE" /bin/bash << EOF
  cd double-agent
  source "\$HOME/.nvm/nvm.sh"
  pm2 ls
  pm2 stop da  &> /dev/null
  rm -rf /tmp/double-agent-download-data/
  yarn
  yarn build
  pm2 start "yarn prod" --time --name=da
  pm2 logs da --format --lines=100
EOF
