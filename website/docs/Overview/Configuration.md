# Configuration

Configuration variables are defined at either:

- `Class` At a SecretAgent class level, which can be configured using [SecretAgent.prewarm()](../basic-interfaces/secret-agent#prewarm) or [SecretAgent.configure()](../basic-interfaces/secret-agent#configure).
- `Instance` At a SecretAgent instance level, configured via [new SecretAgent()](../basic-interfaces/secret-agent#constructor).

### Max Concurrent Sessions Count <div class="specs"><i>Class</i></div>

Limit concurrent SecretAgent sessions running at any given time. Defaults to `10` per SecretAgent class.

### Local Proxy Port Start <div class="specs"><i>Class</i></div>

Configures the port the Man-In-the-Middle server will listen on locally. This server will correct headers and TLS signatures sent by requests to properly emulate the desired browser engine. Default port is `10000`;

### Sessions Directory <div class="specs"><i>Class</i></div>

This can only be set on SecretAgent during the first instantiation or [SecretAgent.prewarm()](../basic-interfaces/secret-agent#prewarm) call.

### Rendering Options <div class="specs"><i>Class</i><i>Instance</i></div>

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

### User Profiles <div class="specs"><i>Class</i></div>

The serialized user profile passed into a SecretAgent instance is never modified.

```js
const rawProfileJson = fs.readFileSync('profile.json', 'utf-8');
const profile = JSON.parse(rawProfileJson); // { cookies: { sessionId: 'test' }}

const agent = new SecretAgent({ userProfile: profile });
const latestUserProfile = await agent.exportUserProfile();
// { cookies, emulatorPlugin, humanoidPlugin, cache, IP }

await agent.goto('http://example.com');

const latestUserProfile = await agent.exportUserProfile();

fs.writeFileSync('profile.json', JSON.stringify(latestUserProfile, null, 2));
```

### Emulators <div class="specs"><i>Class</i><i>Instance</i></div>

### Humanoids <div class="specs"><i>Class</i><i>Instance</i></div>
