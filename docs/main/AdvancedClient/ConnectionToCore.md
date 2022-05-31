# ConnectionToHeroCore

> ConnectionToHeroCore is a built-in mechanism to stream commands to local and remote instances of Hero using the same simple interface.

When you install Hero, it comes ready to run locally with a Chrome engine and client all in your local codebase. However, as you begin to scale the number of concurrent scrapes, you will end up needing to manage a fleet of "engines" running on a number of computers.

```javascript
const { Hero: BaseHero } = require('@ulixee/hero');
const { Hero: FullHero } = require('@ulixee/hero-fullstack');

(async () => {
  const local = new FullHero(); // connects to full, local installation
  const remote = new BaseHero({
    ConnectionToHeroCore: new ConnectionToHeroCore.remote('192.168.1.1:3444'),
  });
})().catch(console.log);
```


Connections take "transports" that allow it to run over different types of connections and protocols. There are 2 types of protocols used in Hero:

- `Direct` - instantiates and connects to a locally install Hero `Core` (used by `@ulixee/hero-fullstack`)
- `WsTransportToCore` - takes a host to dial over a Websocket. See more [here](/docs/hero/advanced-concepts/client-vs-core)

### Configuration {#configuration}

When you provide a ConnectionToHeroCore to a [Hero](/docs/hero/basic-client/hero) instance, Hero will accept either an `options` object or a `ConnectionToHeroCore` instance.

### Options {#options}

The provided settings configure the connection to `Core`. Note: some configurations will apply to all connected Heroes ( `dataDir`).

- options `IConnectionToHeroCoreOptions`. A set of settings that controls the creation of a "connection" to a `Hero Core`.
  - host `string`. An optional `hostname:port` url that will be used to establish a WebSocket Transport to a Hero Core running on another machine. If no host is provided, a connection to a "locally" running `Core` will be attempted.
  - maxConcurrency `number`. The max number of Heroes to allow to be created at the same time. Heroes are "active" until the created Hero is closed. If not provided, this number will match the max allowed by a `Core`.
  - instanceTimeoutMillis `number`. The number of milliseconds to give each Hero in this connection to complete a session. A TimeoutError will be thrown if this time is exceeded.
  - dataDir `string` defaults to `os.tmpdir()/.ulixee`. Directory to store session files and mitm certificates.
- connection `ConnectionToHeroCore`. A pre-initialized connection to a `Hero Core`. You can use this option to pre-check your connection to a remote connection, or to provide customization to the connection.

## Methods

### connection.connect *()* {#connect}

Initializes the connection to the specified core. You can use this function if you would like to pre-connect to your remote host and ensure connections are properly established before continuing.

NOTE: this will be automatically called when you pass in a connection to Hero.

#### **Returns**: `Promise`

### connection.disconnect *()* {#disconnect}

Closes the connection and stops all pending requests.

#### **Returns**: `Promise`
