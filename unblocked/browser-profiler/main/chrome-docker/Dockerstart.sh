#!/bin/bash

chromeArgs=$1
url=$2

#_kill_procs() {
#  kill -TERM $browserProcess
#  wait $browserProcess
#  kill -TERM $xvfb
#}
#
## Setup a trap to catch SIGTERM and relay it to child processes
#trap _kill_procs SIGTERM
#
#XVFB_WHD=${XVFB_WHD:-1280x720x16}
#
## Start Xvfb
#Xvfb :99 -ac -screen 0 $XVFB_WHD -nolisten tcp &
#xvfb=$!
#
#export DISPLAY=:99

chrome --version
chrome $chromeArgs $url &
browserProcess=$!

wait $browserProcess
#wait $xvfb
