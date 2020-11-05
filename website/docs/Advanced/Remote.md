# Remote

@secret-agent/remote makes it easy to run scripts on a remote process/machine that is independent from the one running the actual SecretAgent browser. It does so by piping request/response json objects across your connection of choice.

Setup requires two parts: a Client and a Server.

The Server operates within the same context as the SecretAgent browser. In fact, it's just a simple wrapper for the browser.

The Client operates within the same context as your remote scraping script.

Setting up the Client and Server requires implementing their respective pipeOutgoing and pipeIncoming methods. You should connect these methods into your transport mechanism of choice (http, sockets, etc).

## Setting Up the Server

Below is a server example that uses node's net socket library.

```javascript
const { Server: SecretAgentServer } = require('@secret-agent/remote');
const JsonSocket = require('json-socket');
const Net = require('net');

this.netServer = Net.createServer(netSocket => {
  const jsonSocket = new JsonSocket(netSocket);
  const secretAgentServer = new SecretAgentServer();
  
  jsonSocket.on('message', m => secretAgentServer.pipeIncoming(m));
  secretAgentServer.pipeOutgoing(m => jsonSocket.sendMessage(m));
  netSocket.on('end', () => secretAgentServer.close());
});
this.netServer.listen(8018);
```

For a more complete socket implementation check out @secret-agent/remote-over-sockets.

## Setting Up the Client

Below is a client example that uses node's net socket library.

```javascript
const { Client: SecretAgentClient } = require('@secret-agent/remote');
const Net = require('net');

const secretAgentClient = new SecretAgentClient();
const netSocket = Net.connect({ port: 8018 });
const jsonSocket = new JsonSocket(netSocket);

jsonSocket.on('message', m => secretAgentClient.pipeIncoming(m));
secretAgentClient.pipeOutgoing(m => jsonSocket.sendMessage(m));

netSocket.once('connect', async () => {
  const { SecretAgent } = secretAgentClient;
  const secretAgent = await new SecretAgent();
  const resource = await secretAgent.goto('https://news.ycombinator.com');
  // whatever else you want to do with secretAgent...
});
```
