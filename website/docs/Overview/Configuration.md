# Configuration

### Max Window Count <div class="specs"><i>SecretAgent</i></div>

### Local Proxy Port Start <div class="specs"><i>SecretAgent</i></div>

### Sessions Directory <div class="specs"><i>SecretAgent</i></div>

This can only be set on BrowserInstance at time of creation.

### Rendering Options <div class="specs"><i>SecretAgent</i><i>BrowserInstance</i></div>

One of the best ways to optimize SecretAgent's memory and CPU is limiting the `renderingOptions` to only what you need. The following are valid options.

<p class="show-table-header show-bottom-border minimal-row-height"></p>

| Options | Description |
| --- | --- |
| `AwaitedDOM` | Uses Chromium to attach AwaitedDOM to window.document. |
| `JsRuntime` | Executes JS in webpage. Requires `AwaitedDOM`.  |
| `LoadJsAssets` | Loads all referenced script assets. Requires `JsRuntime`. |
| `LoadCssAssets` | Loads all referenced CSS assets. Requires `JsRuntime`. |
| `LoadImages` | Loads all referenced images on page. Requires `JsRuntime`. |
| `LoadAssets` | Shortcut for `LoadJsAssets`, `LoadCssAssets` and `LoadImages`.  |
| `All` | Activates all features listed above. |
| `None` | No AwaitedDOM or assets. Only retrieves window.response. |

As you'll notice above, some features are dependent on others and therefore automatically enable other features.

Setting an empty features array is the same as setting its default.

The following example disables all browser rendering options and loads the raw response into [DetachedDOM](../core-interfaces/local-dom):

```js
const SecretAgent = require('secret-agent');

const browser = await SecretAgent.createBrowser({ renderingOptions: ['None'] });
const resource = await browser.goto('https://example.org');
const responseHtml = await resource.response.body;

const document = SecretAgent.DetachedDOM.load(responseHtml);
console.log(document.querySelector('title'));
````

### User Profiles <div class="specs"><i>SecretAgent</i></div>

The serialized user profile passed into a SecretAgent instance is never modified.

```js
const rawProfileJson = fs.readFileSync('profile.json', 'utf-8');
const profile = JSON.parse(rawProfileJson); // { cookies: { sessionId: 'test' }}

const browser = await SecretAgent.createBrowser({ userProfile: profile });
const latestUserProfile = await browser.user.export(); 
// { cookies, emulatorPlugin, humanoidPlugin, cache, IP } 

await browser.goto('http://example.com');

const latestUserProfile = await browser.user.export(); // 

fs.writeFileSync('profile.json', JSON.stringify(latestUserProfile, null, 2));
````

### Emulators <div class="specs"><i>SecretAgent</i><i>BrowserInstance</i></div>

### Humanoids <div class="specs"><i>SecretAgent</i><i>BrowserInstance</i></div>
