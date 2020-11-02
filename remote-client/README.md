```
npm install @secret-agent/remote-client
```

# Introduction
@secret-agent/remote-client allows you to run scripts on a remote machine that is independent from the one running the actual SecretAgent core. It does so by piping request/response json objects across your connection of choice.

Setup requires two parts:
- RemoteClient: @secret-agent/remote-client
- CoreServer: @secret-agent/core-server

Both RemoteClient and CoreServer expoose pipeOutgoing and pipeIncoming methods. These methods are used to connect your transport mechanism of choice (http, sockets, etc).

## Setting Up the Client

Below is a client example that uses node's net socket library.

```javascript
const Net = require('net');
const RemoteClient = require('@secret-agent/remote-client');

(async function run() {
  const remoteClient = new RemoteClient();
  const { SecretAgent } = remoteClient;

  // setup
  const coreServerPort = 8124;
  const netConnection = Net.connect({ port: coreServerPort });
  netConnection.setEncoding('utf8');
  netConnection.on('data', json => remoteClient.pipeIncoming(JSON.parse(json)));
  remoteClient.pipeOutgoing(payload => netConnection.write(JSON.stringify(payload)));

  // scrape
  const agent = await new SecretAgent();
  await agent.goto('https://example.org');
})();
```
