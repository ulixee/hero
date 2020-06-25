#!/usr/bin/env bash

platforms=("windows/amd64" "windows/386"  "darwin/amd64"  "linux/amd64" "linux/arm64" "linux/386")

> .checksum

if [ -z "$1"  ]; then
    echo 'Please specify a version argument to this build'
    exit 1
fi

VERSION=$1
echo "VERSION=${VERSION}" >> .checksum
echo "HASH=MD5" >> .checksum

for platform in "${platforms[@]}"
do
    platform_split=(${platform//\// })
    GOOS=${platform_split[0]}
    GOARCH=${platform_split[1]}
    archName=(${GOARCH})
    if [ $GOARCH = "amd64" ]; then
        archName="x86_64"
    elif [ $GOARCH = "386" ]; then
        archName="i386"
    fi



    file_name='connect_'$GOOS'_'$archName
    if [ $GOOS = "windows" ]; then
        file_name+='.exe'
    fi
    output_name=("./build/${file_name}")

    env GOOS=$GOOS GOARCH=$GOARCH go build -o $output_name .
    if [ $? -ne 0 ]; then
        echo 'An error has occurred! Aborting the script execution...'
        exit 1
    fi
    gzip --quiet -f --best $output_name

    md5=$(openssl md5 "${output_name}.gz" | cut -d ' ' -f 2)

    echo "${file_name}.gz=$md5" >> .checksum

done
