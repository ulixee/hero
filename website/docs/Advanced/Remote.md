# Remote

SecretAgent operates out of the box over WebSockets. You'll eventually want to launch Core on a server where clients can remotely access it.

You'll need a simple script to start the server on the machine where the `secret-agent` npm package is installed. Make sure to open the port you allocate on any firewall that a client might have to pass through:

## Setting Up a Server Process

Below is code you can use to start Core in your own server process.

```javascript
// SERVER ip is 122.22.232.1
const Core = require('@secret-agent/core');

(async () => {
  Core.onShutdown = () => {
    log.info('Exiting Core Process');
    process.exit();
  };
  await Core.start({ port: 7007 });
})();
```

## Setting Up the Client

Your [Agent](../basic-interfaces/agent) or [Handler](../basic-interfaces/handler) must be configured to point at this Remote Core (and any others you've set up).

NOTE: you can use the `@secret-agent/client` npm package if you don't want to install a full browser engine on the machine coordinating all your scrapes. That example is shown below.

```javascript
const agent = require('@secret-agent/client');

(async () => {
  await agent.configure({
    connectionToCore: {
      host: 'localhost:7007',
    },
  });

  await agent.goto('https://ulixee.org');
})().catch(console.log);
```
