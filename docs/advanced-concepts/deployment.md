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
npm i --save @ulixee/hero @ulixee/hero-core
```

To connect your client and core, you'll create a transport bridge that will pipe commands back and forth.

```javascript
import HeroCore from '@ulixee/hero-core';
import { TransportBridge } from '@ulixee/net';
import { ConnectionToHeroCore } from '@ulixee/hero';

const bridge = new TransportBridge();
const connectionToCore = new ConnectionToHeroCore(bridge.transportToCore);

const heroCore = new HeroCore();
heroCore.addConnection(bridge.transportToClient);

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
npm i --save @ulixee/hero-core @ulixee/net
```

```js
import HeroCore from '@ulixee/hero-core';
import { WsTransportToClient } from '@ulixee/net';
import * as WebSocket from 'ws';
import * as http from 'http';
import * as https from 'https';

const heroCore = new HeroCore();

// Attach Hero to your Http or Https Server
async function bindHeroCore(yourHttpServer: http.Server | https.Server) {
  
  const wsServer = new WebSocket.Server({
    server: yourHttpServer,
  });
  wsServer.on('connection', (ws, req) => {
    // OPTIONAl: it's configured to listen on a path
    if (req.url.startsWith('/hero')) {
      const transport = new WsTransportToClient(ws, req);
      heroCore.addConnection(transport);
    }
  });
}
```

Add `@ulixee/hero` to your client project:

```bash
npm i --save @ulixee/hero
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

## Secure deployment via Nginx, SSL and Basic Auth
When publically exposing a port, e.g. for `@ulixee/cloud`, you should make sure that (1) traffic is secured via SSL (default websocket communication of hero is without any encryption) and that (2) only your services can access the port.

An nginx reverse proxy provides a solution for both problems: Adding SSL via Let's Encrypt (free) and securing access by both IP and Basic Authentication (username and password).

Prerequisites: You have to own a domain in order to obtain an SSL certificate. You could setup an A record for a subdomain, if you'd like to use the root domain for something else. The following code examples have been tested on Ubuntu Ubuntu 22 LTS.

#### Step-by-step:

1. Install nginx for our proxy solution: `sudo apt-get  install nginx`
2. Install cerbot for generating SSL certificates: `sudo apt install certbot python3-certbot-nginx`
3. Obtain SSL certificate: `sudo certbot certonly --nginx`
4. Create an Nginx configuration - make sure to replace `your_domain.com` with your domain (previously chosen for the SSL certificate) and `xx.xx.xxx.xxx` with the IP addresses you intend to use: `sudo nano /etc/nginx/sites-available/websocket` and add the following:
```console
server {
    listen 443 ssl;
    server_name your_domain.com;

    ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;

    # add IP addresses to allow
    allow xx.xx.xxx.xxx;
    allow xx.xx.xxx.xxx;
    deny all;
    
    location / {
        auth_basic "Restricted Access";
        auth_basic_user_file /etc/nginx/.htpasswd;
        
        proxy_pass http://localhost:1818;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
5. Choose a username for Basic Auth - replace `username` with your chosen username: `sudo sh -c "echo -n 'username:' >> /etc/nginx/.htpasswd"`
6. Choose a password for Basic Auth: `sudo sh -c "openssl passwd -apr1 >> /etc/nginx/.htpasswd"`
7. Activate the configuration via a symlink, test it and on success, restart the Nginx service:
```console
sudo ln -s /etc/nginx/sites-available/websocket /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
8. Make sure `hero-cloud` is running locally on port `1818` (for `docker run` use `-p "127.0.0.1:1818:1818"`) - you could use any other port, but you have to set it in the Nginx configuration file above.
9. Connect via `wss://username:password@your_domain.com` instead of `ws://your_domain:port`