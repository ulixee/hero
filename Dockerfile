FROM node:14-slim

ENV GO_URL https://golang.org/dl/go1.14.2.linux-amd64.tar.gz

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

# Add user so we don't need --no-sandbox.
# same layer as yarn install to keep re-chowned files from using up several hundred MBs more space
RUN cd /app/secret-agent && yarn \
    && groupadd -r sagent && useradd -r -g sagent -G audio,video sagent \
    && mkdir -p /home/sagent/Downloads \
    && chown -R sagent:sagent /home/sagent \
    && chown -R sagent:sagent /app/secret-agent \
    && chown -R sagent:sagent /app/secret-agent/node_modules


RUN sudo $(npx puppet-install-deps)

# Add below to run as unprivileged user.
## USER sagent
