# Deployment

Hero's architecture is split into two processes: a Client and a Core. It's recommended that you read [client vs core](./client-vs-core.md) to understand the difference.

When you start to think about deploying Hero onto a server, you have a few options:

## Launch a Ulixee Cloud

The easiest solution is to use the `@ulixee/cloud` package. See details of the Ulixee Cloud [here](https://ulixee.org/docs/cloud).

You can either launch our pre-built [docker](https://github.com/ulixee/ulixee/tree/main/cloud/tools/docker) image, or start Ulixee Cloud via a simple script. Make sure to open the port you allocate on any firewall that a client might have to pass through:

```javascript
const { CloudNode } = require('@ulixee/cloud');

(async () => {
  const cloudNode = new CloudNode();
  await cloudNode.listen({ port: 7007 });
})();
```

### Setting Up the Client

Your [Hero](../basic-client/hero.md) instance must be configured to point at this Remote Core (and any others you've set up).

NOTE: you can use the `@ulixee/hero` npm package if you don't want to install a full browser engine on the machine coordinating all your scrapes. That example is shown below.

```javascript
const Hero = require('@ulixee/hero');

(async () => {
  const hero = new Hero({
    connectionToCore: {
      host: `${SERVERIP}:7007`,
    },
  });

  await hero.goto('https://ulixee.org');
})().catch(console.log);
```

## Fullstack

If you want to run Hero all in one process, you'll want to run a fullstack deployment. Make sure you add both client and core to your project.

```bash
yarn add @ulixee/hero @ulixee/hero-core
```

To connect your client and core, you'll create a transport bridge that will pipe commands back and forth.

```javascript
import HeroCore from '@ulixee/hero-core';
import TransportBridge from '@ulixee/net/lib/TransportBridge';
import { ConnectionToHeroCore } from '@ulixee/hero';

const bridge = new TransportBridge();
const connectionToCore = new ConnectionToHeroCore(bridge.transportToCore);
HeroCore.addConnection(bridge.transportToClient);

async function main() {
  // hero will connect directly
  const hero = new Hero({ connectionToCore });
  await hero.goto('https://ulixee.org');
}
```

## Integrate with a node Http(s) Server

If you have an existing HTTP server and you want to run your client code separately, you can integrate with an Http/Https server (eg, you might do this to load balance a large volume of scrapes).

Add `@ulixee/hero-core` and `@ulixee/net` to your server project:

```bash
yarn add @ulixee/hero-core @ulixee/net
```

```js
import HeroCore from '@ulixee/hero-core';
import WsTransportToClient from '@ulixee/net/lib/WsTransportToClient';
import * as WebSocket from 'ws';
import * as http from 'http';
import * as https from 'https';

// Attach Hero to your Http or Https Server
async function bindHeroCore(yourHttpServer: http.Server | https.Server) {
  const wsServer = new WebSocket.Server({
    server: yourHttpServer,
  });
  wsServer.on('connection', (ws, req) => {
    // OPTIONAl: it's configured to listen on a path
    if (req.url.startsWith('/hero')) {
      const transport = new WsTransportToClient(ws, req);
      HeroCore.addConnection(transport);
    }
  });
}
```

Add `@ulixee/hero` to your client project:

```bash
yarn add @ulixee/hero
```

```js
// Connect to your server IP and port as configured above
async function runHero(serverIpAndPort: string) {
  // hero will dial your IP:PORT/<OPTIONAL PATH>
  const hero = new Hero({ connectionToCore: { host: `${serverIpAndPort}/hero` } });
  await hero.goto('https://ulixee.org');
}
```

NOTE: If you don't have an existing Http server, a normal NodeJs server will suffice.

```js
import * as http from 'http';

const server = new http.Server();
await new Promise(resolve => server.listen(8080, resolve));
```
