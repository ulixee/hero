# Configuration

Configuration variables can be defined at a few levels:

- `Agent` At an instance level, configured via [agent.configure()](/docs/basic-interfaces/agent#configure) or [new Agent()](/docs/basic-interfaces/agent#constructor), or when creating [Handler](/docs/basic-interfaces/handler) agents using [handler.createAgent()](/docs/basic-interfaces/handler#create-agent) or [handler.dispatchAgent()](/docs/basic-interfaces/handler#dispatch-agent).
- `Connection` At a connection level, which can be configured when creating a new [ConnectionToCore](/docs/advanced/connection-to-core#configuration).
- `Core` At an internal level, using the `@secret-agent/core` module of SecretAgent. This must be run in the environment where your Browser Engine(s) and `@secret-agent/core` module are running. If you're running remote, this will be your server.

The internal `@secret-agent/core` module can receive several configuration options on [start](#core-start), or when a [Handler](/docs/basic-interfaces/handler) or [Agent](/docs/basic-interfaces/agent) establishes a [connection](/docs/advanced/connection-to-core).

### Connection To Core <div class="specs"><i>Agent</i></div>

The [ConnectionToCore](/docs/advanced/connection-to-core) to be used by a [Handler](/docs/basic-interfaces/handler) or [Agent](/docs/basic-interfaces/agent).

All [configurations](/docs/advanced/connection-to-core#configurations) accept both an `options` object and a [`ConnectionToCore`](/docs/advanced/connection-to-core) instance.

Configuration is accepted in the following methods and constructors:

- [agent.configure()](/docs/basic-interfaces/agent#configure) - apply the connection to the default agent, or to a an agent constructed prior to the first connection.
- [new Agent()](/docs/basic-interfaces/agent#constructor) - the new agent will use this connection.
- [new Handler(...connections)](/docs/basic-interfaces/handler#constructor) - a handler takes one or more coreClientConnection options or instances.

### Max Concurrent Agents Count <div class="specs"><i>Core</i></div>

Limit concurrent Agents operating at any given time across all [connections](/docs/advanced/connection-to-core) to a "Core". Defaults to `10`.

Configurable via [`Core.start()`](#core-start) or [`ConnectionToCore`](/docs/advanced/connection-to-core#configuration).

### Local Proxy Port Start <div class="specs"><i>Connection</i><i>Core</i></div>

Configures the port the Man-In-the-Middle server will listen on locally. This server will correct headers and TLS signatures sent by requests to properly emulate the desired browser engine. Default port is `0`, which will find an open port locally.

Configurable via [`Core.start()`](#core-start) or the first [`ConnectionToCore`](/docs/advanced/connection-to-core#configuration).

### Replay Session Port <div class="specs"><i>Connection</i><i>Core</i></div>

Configures the port Replay uses to serve Session data.

Configurable via [`Core.start()`](#core-start) or the first [`ConnectionToCore`](/docs/advanced/connection-to-core#configuration).

### Sessions Dir <div class="specs"><i>Connection</i><i>Core</i></div> {#sessions-dir}

Configures the storage location for files created by Core.

- Replay session files
- Man-in-the-middle network certificates

`Environmental variable`: `SA_SESSIONS_DIR=/your-absolute-dir-path`

Configurable via [`Core.start()`](#core-start) or the first [`ConnectionToCore`](/docs/advanced/connection-to-core).

### Blocked Resource Types <div class="specs"><i>Connection</i><i>Agent</i></div> {#blocked-resources}

One of the best ways to optimize SecretAgent's memory and CPU is setting `blockedResourceTypes` to block resources you don't need. The following are valid options.

<p class="show-table-header show-bottom-border minimal-row-height"></p>

| Options          | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| `JsRuntime`      | Executes JS in webpage. Requires `AwaitedDOM`.                     |
| `BlockJsAssets`  | Loads all referenced script assets. Requires `JsRuntime`.          |
| `BlockCssAssets` | Loads all referenced CSS assets. Requires `JsRuntime`.             |
| `BlockImages`    | Loads all referenced images on page. Requires `JsRuntime`.         |
| `BlockAssets`    | Shortcut for `LoadJsAssets`, `LoadCssAssets` and `LoadImages`.     |
| `All`            | Blocks all of the resources above. Only retrieves window.response. |
| `None`           | No assets are blocked. `default`                                   |

As you'll notice above, some features are dependent on others and therefore automatically enable other features.

Setting an empty array is the same as setting to `None`.

### User Profile <div class="specs"><i>Connection</i><i>Agent</i></div>

A user profile stores and restores Cookies, DOM Storage and IndexedDB records for an Agent. NOTE: the serialized user profile passed into an Agent instance is never modified. If you want to update a profile with changes, you should re-export and save it to the format you're persisting to.

```js
const rawProfileJson = fs.readFileSync('profile.json', 'utf-8');
const profile = JSON.parse(rawProfileJson); // { cookies: { sessionId: 'test' }}

agent.configure({ userProfile: profile });
const latestUserProfile = await agent.exportUserProfile();
// { cookies, localStorage, sessionStorage, indexedDBs }

await agent.goto('http://example.com');

const latestUserProfile = await agent.exportUserProfile();

fs.writeFileSync('profile.json', JSON.stringify(latestUserProfile, null, 2));
```

### Upstream Proxy <div class="specs"><i>Agent</i></div>

Configures a proxy url to route traffic through for a given Agent. This function supports two types of proxies:

- `Socks5` - many VPN providers allow you to use a socks5 configuration to send traffic through one of their VPNs behind the scenes. You can pass any required username and password through the `UserInfo` portion of the url, e.g., `socks5://username:password@sockshost.com:1080`.
- `Http` - an http proxy will create secure TLS socket to an upstream server using the HTTP connect verb. Services like [luminati](https://luminati.io) provide highly configurable Http proxies that can route traffic from various geographic locations and "grade" of IP - ie, consumer IP vs datacenter.

An upstream proxy url should be a fully formatted url to the proxy. If your proxy is socks5, start it with `socks5://`, http `http://` or `https://` as needed. An upstream proxy url can optionally include the user authentication parameters in the url. It will be parsed out and used as the authentication.

### Browsers Emulator Id <div class="specs"><i>Agent</i></div>

Configures which [BrowserEmulator](/docs/advanced/browser-emulators) to use in a given Agent.

### Human Emulator Id <div class="specs"><i>Agent</i></div>

Configures which [HumanEmulator](/docs/advanced/human-emulators) to use in an Agent instance.

## Core Configuration

Configuration for Core should be performed before initialization.

### Core.start*(options)* {#core-start}

Update existing settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - maxConcurrentAgentsCount `number` defaults to `10`. Limit concurrent Agent sessions running at any given time.
  - localProxyPortStart `number` defaults to `any open port`. Starting internal port to use for the mitm proxy.
  - sessionsDir `string` defaults to `os.tmpdir()/.secret-agent`. Directory to store session files and mitm certificates.
  - coreServerPort `number`. Port to run the Core Websocket/Replay server on.

#### **Returns**: `Promise`
