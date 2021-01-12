# Remote

SecretAgent comes out of the box ready to act as a remote process that can communicate over a WebSocket to a client.

You'll need a simple script to start the server on the machine where the `secret-agent` npm package is installed. Make sure to open the port you allocate on any firewall that a client might have to pass through:

## Setting Up the Server

Below is code you can use or modify to run a server

```javascript
// SERVER ip is 122.22.232.1
const { CoreServer } = require('@secret-agent/core');

(async () => {
  const server = new CoreServer();
  await server.listen(7007);
})().catch(console.log);
```

## Setting Up the Client

Your [Agent](../basic-interfaces/agent) or [Handler](../basic-interfaces/handler) must be configured to point at this Remote Core (and any others you've set up).

NOTE: you can use the `@secret-agent/client` npm package if you don't want to install a full browser engine on the machine coordinating all your scrapes. That example is shown below.

```javascript
const agent = require('@secret-agent/client');

(async () => {
  await agent.configure({
    coreConnection: {
      host: 'localhost:7007',
    },
  });

  await agent.goto('https://ulixee.org');
})().catch(console.log);
```
