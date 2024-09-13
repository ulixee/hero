#!/usr/bin/env bash

SERVER_PEM="$HOME/.ssh/id_rsa_ulixee_digital_ocean"

ssh -i $SERVER_PEM root@$REMOTE
