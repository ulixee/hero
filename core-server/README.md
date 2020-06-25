## Setting Up the Server

Below is a server example that uses node's net socket library.

```javascript
const Net = require('net');
const CoreServer = require('@secret-agent/core-server');

(async function run() {
  const coreServer = new CoreServer();
  const server = Net.createServer(async netConnection => {
    const coreConnection = coreServer.addConnection(netConnection);
    coreConnection.pipeOutgoing(async payload => netConnection.write(JSON.stringify(payload)));
    netConnection.setEncoding('utf8');
    netConnection.on('data', json => coreConnection.pipeIncoming(JSON.parse(json)));
    netConnection.on('end', () => coreConnection.close());
  });

  server.on('error', (err) => throw err);
  server.listen(8124, () => console.log('Server ready!'));

})().catch(error => {
  console.log(error);
});
```
