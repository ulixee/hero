#!/usr/bin/env bash

openssl genrsa -out server.key 2048
openssl req -new -out server.csr -key server.key -config openssl.cnf
openssl x509 -req -days 3650 -in server.csr -signkey server.key -out server.crt -extensions v3_req -extfile openssl.cnf
cat server.crt server.key > privkey.pem
openssl x509 -in server.crt -out fullchain.pem -outform PEM
rm server.*
open ./fullchain.pem
