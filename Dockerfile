FROM node:12-slim

ENV CHROME_URL http://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_80.0.3987.122-1_amd64.deb
ENV GO_URL https://golang.org/dl/go1.14.2.linux-amd64.tar.gz

RUN apt-get update \
    && apt-get install -y git wget pkg-config apt-utils --no-install-recommends \
    && wget -O chrome-stable.deb "${CHROME_URL}" -q --progress=bar  \
    && apt install -y ./chrome-stable.deb \
    && rm chrome-stable.deb \
    && apt-get clean \
    && apt-get autoremove -y

# fonts
RUN echo "deb http://httpredir.debian.org/debian buster main contrib non-free" > /etc/apt/sources.list \
    && echo "deb http://httpredir.debian.org/debian buster-updates main contrib non-free" >> /etc/apt/sources.list \
    && echo "deb http://security.debian.org/ buster/updates main contrib non-free" >> /etc/apt/sources.list \
    && echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
    && apt-get update \
    && apt-get install -y \
        fonts-arphic-ukai \
        fonts-arphic-uming \
        fonts-ipafont-mincho \
        fonts-thai-tlwg \
        fonts-kacst \
        fonts-ipafont-gothic \
        fonts-unfonts-core \
        ttf-wqy-zenhei \
        ttf-mscorefonts-installer \
        fonts-freefont-ttf \
    && apt-get clean \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

## TODO: randomize font installs and add from google https://gist.github.com/keeferrourke/d29bf364bd292c78cf774a5c37a791db

# Install Go for Mitm sockets
RUN set -eux; \
	wget -O go.tgz "${GO_URL}" -q --progress=bar; \
	tar -C /usr/local -xzf go.tgz; \
	rm go.tgz; \
	export PATH="/usr/local/go/bin:$PATH"; \
	go version

ENV GOPATH /go
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH

RUN mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 777 "$GOPATH"

WORKDIR /app/secret-agent

COPY ./build-dist /app/secret-agent/

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV CHROME_BIN=/usr/bin/google-chrome-stable

# Add user so we don't need --no-sandbox.
# same layer as yarn install to keep re-chowned files from using up several hundred MBs more space
RUN cd /app/secret-agent && yarn \
    && groupadd -r sagent && useradd -r -g sagent -G audio,video sagent \
    && mkdir -p /home/sagent/Downloads \
    && chown -R sagent:sagent /home/sagent \
    && chown -R sagent:sagent /app/secret-agent \
    && chown -R sagent:sagent /app/secret-agent/node_modules

# Add below to run as unprivileged user.
## USER sagent
