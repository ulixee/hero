# Configuration

Configuration variables can be defined at a few levels:

- `Hero` At an instance level, configured via [new Hero()](../basic-client/hero.md#constructor).
- `Connection` At a connection level, which can be configured when creating a new [ConnectionToCore](../advanced-client/connection-to-core.md#configuration).
- `Core` At an internal level, using the `@ulixee/hero-core` module of Hero. This must be run in the environment where your Browser Engine(s) and `@ulixee/hero-core` module are running. If you're running remote, this will be your server.

The internal `@ulixee/hero-core` module can receive several configuration options on [start](#core-start.md), or when a new [connection](../advanced-client/connection-to-core.md) is established.

### Connection To Core <div class="specs"><i>Hero</i></div>

The [ConnectionToCore](../advanced-client/connection-to-core.md) to be used by one or more [Hero](../basic-client/hero.md) instances.

All [configurations](../advanced-client/connection-to-core#configurations) accept both an `options` object and a [`ConnectionToCore`](../advanced-client/connection-to-core.md) instance.

### Max Concurrent Heroes Count <div class="specs"><i>Core</i></div>

Limit concurrent Heroes operating at any given time across all [connections](../advanced-client/connection-to-core.md) to a "Core". Defaults to `10`.

Configurable via [`Core.start()`](#core-start.md) or [`ConnectionToCore`](../advanced-client/connection-to-core.md#configuration).

### Data Dir <div class="specs"><i>Connection</i><i>Core</i></div> {#data-dir}

Configures the storage location for files created by Core.

- Session Databases
- Man-in-the-middle network certificates

`Environmental variable`: `ULX_DATA_DIR=/your-absolute-dir-path`

Configurable via [`Core.start()`](#core-start.md) or the first [`ConnectionToCore`](../advanced-client/connection-to-core.md).

### Disable Session Persistence <div class="specs"><i>Core</i><i>Hero</i></div>

Configuration to disable session persistence. This will instruct Hero to clean up sessions AFTER they are closed.

Configurable as a Hero Core option via [`Core.start({ disableSessionPersistence: true })`](#core-start.md) or [Hero](../basic-client/hero.md) instances via `sessionPersistence: false`.

`Environmental variable`: `ULX_DISABLE_SESSION_PERSISTENCE=true`

### Blocked Resource Types <div class="specs"><i>Connection</i><i>Hero</i></div> {#blocked-resources}

One of the best ways to optimize Hero's memory and CPU is setting `blockedResourceTypes` to block resources you don't need. The following are valid options.

<p class="show-table-header show-bottom-border minimal-row-height"></p>

| Options             | Description                                                             |
| ------------------- | ----------------------------------------------------------------------- |
| `JsRuntime`         | Executes JS in webpage. Requires `AwaitedDOM`.                          |
| `BlockJsResources`  | Blocks all referenced script assets.                                    |
| `BlockCssResources` | Blocks all referenced CSS assets.                                       |
| `BlockImages`       | Blocks all referenced images on page.                                   |
| `BlockFonts`        | Blocks all referenced fonts on page.                                    |
| `BlockIcons`        | Blocks all referenced icons on page.                                    |
| `BlockMedia`        | Blocks all referenced media on page.                                    |
| `BlockAssets`       | Shortcut for `BlockJsResources`, `BlockCssResources` and `BlockImages`. |
| `All`               | Blocks all of the resources above. Only retrieves window.response.      |
| `None`              | No assets are blocked. `default`                                        |

As you'll notice above, some features are dependent on others and therefore automatically enable other features.

Setting an empty array is the same as setting to `None`.

### Blocked Urls<div class="specs"><i>Connection</i><i>Hero</i></div> {#blocked-urls}

Similar to [`Blocked Resource Types`](#blocked-resources), this allows you to block resources
from being loaded. Instead of focusing on the type of resource we are focussing on the url instead.

Wild cards can be used as well.

Examples:

```
http://example.com
example.com
*.example.com
*example.com
```

### Intercepted Resources

This allows you to intercept resources and modify them before they are loaded. This is useful for modifying the response of a request.

```js
const hero = new Hero({
  interceptedResources: [
    {
      url: 'https://example.com',
      body: '<div>Hello World!</div>',
    },
  ],
});

const heroStatus = new Hero({
  interceptedResources: [
    {
      url: 'https://example.com',
      statusCode: 404,
    },
  ],
});

const heroHeaders = new Hero({
  interceptedResources: [
    {
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'text/html',
        },
      ],
    },
  ],
});
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

### Core.start _(options)_ {#core-start}

Update existing settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - maxConcurrentClientCount `number` defaults to `10`. Limit concurrent Hero sessions running at any given time.
  - maxConcurrentClientsPerBrowser `number` defaults to `10`. Limit concurrent Hero sessions running per Chrome instance at any given time.
  - dataDir `string` defaults to `os.tmpdir()/.ulixee`. Directory to store session databases and mitm certificates.
  - defaultUnblockedPlugins `IAgentPluginClass[]`. A list of [Unblocked Plugin](https://github.com/ulixee/hero/tree/main/specification) classes to be installed by default in new Agents.

#### **Returns**: `Promise`
