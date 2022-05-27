# Client vs. Core

Hero's architecture is split into two processes: a Client and a Core. The Client is what your script interacts with; Core is what does most of the heavy lifting. WebSockets is the default mechanism for communicating between these two processes. Most users have no need to know anything about Core since Hero simpliy works out of the box.

However, this division of process allows for some interesting advanced configurations. For example, you can run a single lightweight Client on one lightweight machine with multiple Cores running on separate heavier-duty machines.

## Setting Up a Server Process for Core

The `@ulixee/hero-core` package contains all the logic for running Core, but it has no network connectivity. The easiest solution is to use the `@ulixee/server` package. See details of the Ulixee Server [here](/docs/server).

You'll need a simple script to start the server on the machine where the `@ulixee/hero-core` npm package is installed. Make sure to open the port you allocate on any firewall that a client might have to pass through:


```javascript
// SERVER ip is 122.22.232.1
const Server = require('@ulixee/server');

(async () => {
  const server = new Server();
  await server.listen({ port: 7007 });
})();
```

## Setting Up the Client

Your [Hero](/docs/hero/basic-client/hero) instance must be configured to point at this Remote Core (and any others you've set up).

NOTE: you can use the `@ulixee/hero` npm package if you don't want to install a full browser engine on the machine coordinating all your scrapes. That example is shown below.

```javascript
const Hero = require('@ulixee/hero');

(async () => {
  const hero = new Hero({
    connectionToCore: {
      host: 'ws://localhost:7007',
    },
  });

  await hero.goto('https://ulixee.org');
})().catch(console.log);
```
