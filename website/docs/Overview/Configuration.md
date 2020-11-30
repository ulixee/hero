# Configuration

Configuration variables are defined at either:

- `Class` At a SecretAgent class level, which can be configured using [SecretAgent.prewarm()](../basic-interfaces/secret-agent#prewarm) or [SecretAgent.configure()](../basic-interfaces/secret-agent#configure).
- `Instance` At a SecretAgent instance level, configured via [new SecretAgent()](../basic-interfaces/secret-agent#constructor).
- `Core` Must be configured within the internal `@secret-agent/core` module of SecretAgent. This must be run in the environment where your Browser Engine(s) and `@secret-agent/core` module are running. If you're running remote, this will be your server.

The internal `@secret-agent/core` function can receive several configuration options

### Max Concurrent Sessions Count <div class="specs"><i>Core</i></div>

Limit concurrent SecretAgent sessions running at any given time. Defaults to `10` per SecretAgent class.

Configurable via [`Core.configure()`](#core-configure) or [`Core.prewarm()`](#core-prewarm).

### Local Proxy Port Start <div class="specs"><i>Core</i></div>

Configures the port the Man-In-the-Middle server will listen on locally. This server will correct headers and TLS signatures sent by requests to properly emulate the desired browser engine. Default port is `0`, which will find an open port locally.

Configurable via `Core.configure()`.

### Replay Session Port <div class="specs"><i>Core</i></div>

Configures the port Replay uses to serve Session data.

Configurable via [`Core.configure()`](#core-configure) or [`Core.prewarm()`](#core-prewarm).

### Sessions Directory <div class="specs"><i>Core</i></div>

This can only be set on SecretAgent during the first instantiation or [`SecretAgent.prewarm()`](../basic-interfaces/secret-agent#prewarm) call.

`Environmental variable`: `SA_SESSIONS_DIR=/your-absolute-dir-path`

Configurable via [`Core.configure()`](#core-configure) or [`Core.prewarm()`](#core-prewarm).

### Rendering Options <div class="specs"><i>Class</i><i>Instance</i></div> {#rendering}

One of the best ways to optimize SecretAgent's memory and CPU is limiting the `renderingOptions` to only what you need. The following are valid options.

<p class="show-table-header show-bottom-border minimal-row-height"></p>

| Options         | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `AwaitedDOM`    | Uses Chromium to attach AwaitedDOM to window.document.         |
| `JsRuntime`     | Executes JS in webpage. Requires `AwaitedDOM`.                 |
| `LoadJsAssets`  | Loads all referenced script assets. Requires `JsRuntime`.      |
| `LoadCssAssets` | Loads all referenced CSS assets. Requires `JsRuntime`.         |
| `LoadImages`    | Loads all referenced images on page. Requires `JsRuntime`.     |
| `LoadAssets`    | Shortcut for `LoadJsAssets`, `LoadCssAssets` and `LoadImages`. |
| `All`           | Activates all features listed above.                           |
| `None`          | No AwaitedDOM or assets. Only retrieves window.response.       |

As you'll notice above, some features are dependent on others and therefore automatically enable other features.

Setting an empty features array is the same as setting its default.

The following example disables all browser rendering options and loads the raw response into [DetachedDOM](../core-interfaces/local-dom):

```js
const SecretAgent = require('secret-agent');

const agent = new SecretAgent({ renderingOptions: ['None'] });
const resource = await agent.goto('https://example.org');
const responseHtml = await resource.response.body;

const document = SecretAgent.DetachedDOM.load(responseHtml);
console.log(document.querySelector('title'));
```

### User Profiles <div class="specs"><i>Class</i><i>Instance</i></div>

The serialized user profile passed into a SecretAgent instance is never modified.

```js
const rawProfileJson = fs.readFileSync('profile.json', 'utf-8');
const profile = JSON.parse(rawProfileJson); // { cookies: { sessionId: 'test' }}

const agent = new SecretAgent({ userProfile: profile });
const latestUserProfile = await agent.exportUserProfile();
// { cookies, localStorage, sessionStorage, indexedDBs }

await agent.goto('http://example.com');

const latestUserProfile = await agent.exportUserProfile();

fs.writeFileSync('profile.json', JSON.stringify(latestUserProfile, null, 2));
```

### Upstream Proxy <div class="specs"><i>Instance</i></div>

Configures a proxy url to route traffic through for a given session. This function supports two types of proxies:

- `Socks5` - many VPN providers allow you to use a socks5 configuration to send traffic through one of their VPNs behind the scenes. You can pass any required username and password through the `UserInfo` portion of the url, e.g., `socks5://username:password@sockshost.com:1080`.
- `Http` - an http proxy will create secure TLS socket to an upstream server using the HTTP connect verb. Services like [luminati](https://luminati.io) provide highly configurable Http proxies that can route traffic from various geographic locations and "grade" of IP - ie, consumer IP vs datacenter.

An upstream proxy url should be a fully formatted url to the proxy. If your proxy is socks5, start it with `socks5://`, http `http://` or `https://` as needed. An upstream proxy url can optionally include the user authentication parameters in the url. It will be parsed out and used as the authentication.

### Browsers Emulator Ids <div class="specs"><i>Class</i><i>Instance</i><i>Core</i></div>

Configures which [BrowserEmulators](../advanced/browser-emulators) to prewarm.

Configurable via `Core` or [`SecretAgent`](../basic-interfaces/secret-agent#configure)

### BrowserEmulators <div class="specs"><i>Class</i><i>Instance</i></div>

### HumanEmulators <div class="specs"><i>Class</i><i>Instance</i></div>

## Core Configuration

Configuration for Core should be performed before initialization.

### Core.configure*(options)* {#core-configure}

Update existing settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - maxConcurrentSessionsCount `number` defaults to `10`. Limit concurrent SecretAgent sessions running at any given time.
  - localProxyPortStart `number` defaults to `any open port`. Starting internal port to use for the mitm proxy.
  - sessionsDir `string` defaults to `os.tmpdir()/.secret-agent`. Directory to store session files and mitm certificates.
  - defaultRenderingOptions `string[]` defaults to `[All]`. Controls enabled browser rendering features.
  - defaultUserProfile `IUserProfile`. Define user cookies, session, and more.
  - replayServerPort `number`. Port to start a live replay server on. Defaults to "any open port".

#### **Returns**: `Promise`

The internal `@secret-agent/core` function can receive several configuration options

### Core.prewarm*(options)* {#core-prewarm}

Takes the same configuration object as [`Core.configure`](#core-configure)

#### **Returns**: `Promise`
