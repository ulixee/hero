#!/bin/bash

current_path=$(dirname $0)
port=45707

## example of running
docker run -it --rm --ipc=host --user agent \
    --security-opt seccomp="$current_path/seccomp_profile.json" \
    -p "$port:$port" \
    -e DEBUG=1 \
    < your script here >
