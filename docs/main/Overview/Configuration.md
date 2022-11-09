# Configuration

Configuration variables can be defined at a few levels:

- `Hero` At an instance level, configured via [new Hero()](/docs/hero/basic-client/hero#constructor).
- `Connection` At a connection level, which can be configured when creating a new [ConnectionToCore](/docs/hero/advanced-client/connection-to-core#configuration).
- `Core` At an internal level, using the `@ulixee/hero-core` module of Hero. This must be run in the environment where your Browser Engine(s) and `@ulixee/hero-core` module are running. If you're running remote, this will be your server.

The internal `@ulixee/hero-core` module can receive several configuration options on [start](#core-start), or when a new [connection](/docs/hero/advanced-client/connection-to-core) is established.

### Connection To Core <div class="specs"><i>Hero</i></div>

The [ConnectionToCore](/docs/hero/advanced-client/connection-to-core) to be used by one or more [Hero](/docs/hero/basic-client/hero) instances.

All [configurations](/docs/hero/advanced-client/connection-to-core#configurations) accept both an `options` object and a [`ConnectionToCore`](/docs/hero/advanced-client/connection-to-core) instance.

### Max Concurrent Heroes Count <div class="specs"><i>Core</i></div>

Limit concurrent Heroes operating at any given time across all [connections](/docs/hero/advanced-client/connection-to-core) to a "Core". Defaults to `10`.

Configurable via [`Core.start()`](#core-start) or [`ConnectionToCore`](/docs/hero/advanced-client/connection-to-core#configuration).

### Data Dir <div class="specs"><i>Connection</i><i>Core</i></div> {#data-dir}

Configures the storage location for files created by Core.

- Session Databases
- Man-in-the-middle network certificates

`Environmental variable`: `ULX_DATA_DIR=/your-absolute-dir-path`

Configurable via [`Core.start()`](#core-start) or the first [`ConnectionToCore`](/docs/hero/advanced-client/connection-to-core).

### Blocked Resource Types <div class="specs"><i>Connection</i><i>Hero</i></div> {#blocked-resources}

One of the best ways to optimize Hero's memory and CPU is setting `blockedResourceTypes` to block resources you don't need. The following are valid options.

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

### Blocked Urls<div class="specs"><i>Connection</i><i>Hero</i></div> {#blocked-urls}

Similar to [`Blocked Resource Types`](#blocked-resources), this allows you to block resources
from being loaded. Instead of focussing on the type of resource we are focussing on the url instead.

Wild cards can be used as well.

Examples:

```
http://example.com
example.com
*.example.com
*example.com
```

### User Profile <div class="specs"><i>Connection</i><i>Hero</i></div>

A user profile stores and restores Cookies, DOM Storage and IndexedDB records for an Hero. NOTE: the serialized user profile passed into an Hero instance is never modified. If you want to update a profile with changes, you should re-export and save it to the format you're persisting to.

```js
const rawProfileJson = fs.readFileSync('profile.json', 'utf-8');
const profile = JSON.parse(rawProfileJson); // { cookies: { sessionId: 'test' }}

const hero = new Hero({ userProfile: profile });
const latestUserProfile = await hero.exportUserProfile();
// { cookies, localStorage, sessionStorage, indexedDBs }

await hero.goto('http://example.com');

const latestUserProfile = await hero.exportUserProfile();

fs.writeFileSync('profile.json', JSON.stringify(latestUserProfile, null, 2));
```

### Upstream Proxy Url <div class="specs"><i>Hero</i></div>

Configures a proxy url to route traffic through for a given Hero. This function supports two types of proxies:

- `Socks5` - many VPN providers allow you to use a socks5 configuration to send traffic through one of their VPNs behind the scenes. You can pass any required username and password through the `UserInfo` portion of the url, e.g., `socks5://username:password@sockshost.com:1080`.
- `Http` - an http proxy will create secure TLS socket to an upstream server using the HTTP connect verb. Services like [luminati](https://luminati.io) provide highly configurable Http proxies that can route traffic from various geographic locations and "grade" of IP - ie, consumer IP vs datacenter.

An upstream proxy url should be a fully formatted url to the proxy. If your proxy is socks5, start it with `socks5://`, http `http://` or `https://` as needed. An upstream proxy url can optionally include the user authentication parameters in the url. It will be parsed out and used as the authentication.

## Core Configuration

Configuration for Core should be performed before initialization.

### Core.start *(options)* {#core-start}

Update existing settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - maxConcurrentClientCount `number` defaults to `10`. Limit concurrent Hero sessions running at any given time.
  - dataDir `string` defaults to `os.tmpdir()/.ulixee`. Directory to store session databases and mitm certificates.
  - defaultUnblockedPlugins `IAgentPluginClass[]`. A list of [Unblocked Plugin](https://github.com/ulixee/unblocked/main/tree/specification) classes to be installed by default in new Agents.

#### **Returns**: `Promise`
