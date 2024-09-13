#!/bin/bash

chrome_args=$1
url=$2

USE_XVFB=false
XVFB_WHD=${XVFB_WHD:-1280x720x16}

_kill_procs() {
    kill -TERM $browser_proc
    wait $browser_proc

    kill -TERM $soc_proc
    wait $soc_proc

    if [[ -n "$xvfb" ]]; then
        kill -TERM $xvfb_proc
        wait $xvfb_proc
    fi
}

# Setup a trap to catch SIGTERM and relay it to child processes
trap _kill_procs SIGTERM

xvfb_proc=""
if $USE_XVFB; then
    Xvfb :99 -ac -screen 0 $XVFB_WHD -nolisten tcp &
    xvfb_proc=$!
    export DISPLAY=:99
fi

# Chrome remote debugging port only binds to 127.0.0.1 when running in
# headless=new or headfull mode, even when you try to configure it otherwise.
# So this is our way of making sure this still works.

socat TCP4-LISTEN:9222,fork TCP4:127.0.0.1:19222 &
soc_proc=$!

chrome_args="${chrome_args//9222/19222}"
echo "Launching: chrome $chrome_args $url "

chrome --version
chrome $chrome_args $url &
browser_proc=$!

wait $browser_proc