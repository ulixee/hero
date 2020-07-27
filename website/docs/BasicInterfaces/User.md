# User

User instances allows you to control interaction with a browser instance.

## Constructor

User instances cannot be instantiated. You must retrieve a User from a [Browser](./browser) instance:

```js
const browser = await SecretAgent.createBrowser();
const user = browser.user;
```

## Properties

### user.cookies

Returns an array of cookie objects for this user.

#### **Type**: `Promise<Cookie[]>`

### user.storage

The current session DOM storage items (IDomStorage has a `localStorage`, `sessionStorage`, `indexedDB`).

#### **Type**: `{ [securityOrigin: string]: IDomStorage }`
 - `IDomStorage`
      - localStorage `[key,value][]`. Array of local storage key/value paris
      - sessionStorage `[key,value][]`. Array of session storage key/value paris
      - indexedDB `IndexedDb[]`. Array of IndexedDB databases with data

### user.lastCommandId

An execution point that refers to a command run by this user (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` functions to indicate a starting point to listen for changes.

#### **Type**: `number`

## Methods

### user.click*(mousePosition)* {#click}

Executes a click interaction. This is a shortcut for `user.interact({ click: mousePosition })`. See the [Interactions page](./interactions) for more details.

#### **Arguments**:

- mousePosition `MousePosition`

#### **Returns**: `Promise`

### <a name="goto"></a> user.goto*(locationHref)* {#goto}

Executes a navigation request for the document associated with the parent Secret Agent instance.

#### **Arguments**:

- locationHref `string` The location to navigate to

#### **Returns**: `Promise<Resource>` The loaded resource representing this page.

### user.interact*(interaction\[, interaction, ...])* {#interact}

Executes a series of mouse and keyboard interactions.

#### **Arguments**:

- interaction `Interaction`

#### **Returns**: `Promise`

Refer to the [Interactions page](./interactions) for details on how to construct an interaction.

### user.type*(keyboardInteraction\[, keyboardInteraction, ...])* {#type}

Executes a keyboard interactions. This is a shortcut for `user.interact({ type: string | KeyName[] })`.

#### **Arguments**:

- keyboardInteraction `KeyboardInteraction`

#### **Returns**: `Promise`

Refer to the [Interactions page](./interactions) for details on how to construct keyboard interactions.

### user.waitForLoad*(status)* {#wait-for-load}

Wait for the a load status to occur on a page.

#### **Arguments**:

- status `NavigationRequested | HttpRequested | HttpResponsed | HttpRedirected | DomContentLoaded | AllContentLoaded` The load status event to wait for.

#### **Returns**: `Promise<void>`

The following are possible statuses and their meanings:

<div class="show-table-header show-bottom-border minimal-row-height"></div>

| Status                | Description                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NavigationRequested` | A navigation request is initiated by the page or user                                                                                                                               |
| `HttpRequested`       | The http request for the document has been initiated                                                                                                                                |
| `HttpResponded`       | The http response has been retrieved                                                                                                                                                |
| `HttpRedirected`      | The original http request was redirected                                                                                                                                            |
| `DomContentLoaded`    | The dom content has been received and loaded into the document                                                                                                                      |
| `AllContentLoaded`    | All dependent resources such as stylesheets and images. This is similar to the traditional [window load event](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event). |

### user.waitForLocation*(trigger)* {#wait-for-location}

Waits for a navigational change to user.location either because of a reload event or changes to the URL.

#### **Arguments**:

- trigger `change | reload` The same url has been reloaded or it's a new url.

#### **Returns**: `Promise`

Location changes are triggered in one of two ways:

<div class="show-table-header show-bottom-border minimal-row-height"></div>

| Trigger  | Description                                                    |
| -------- | -------------------------------------------------------------- |
| `change` | A navigational change to document.location has been triggered. |
| `reload` | A reload of the current document.location has been triggered.  |

The following example waits for a new page to load after clicking on an anchor tag:

```js
const agent = new SecretAgent();
const { user, document } = agent;
await user.goto('http://example.com');

await document.querySelector('a').click();
await user.waitForLocation('change');

const newUrl = await document.location.href;
```

### user.waitForResource*(filter, options)* {#wait-for-resource}

Wait until a specific image, stylesheet, script, websocket or other resource URL has been received.

#### **Arguments**:

- filter `object` Accepts any of the following:
  - url `string | RegExp` A string or regex to match a url on
  - type `ResourceType` A resource type to filter on
  - filterFn `function(resource: Resource, done: Callback): boolean` A function to allow further filtering of returned resources. Return true to include resources, false to exclude. Calling `done` finishes execution.
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds
  - throwIfTimeout `boolean`. Throw an exception if a timeout occurs. Default `true`
  - sinceCommandId `number`. A `commandId` from which to look for resources.

#### **Returns**: `Promise<Resource[]>`

```js
const agent = new SecretAgent();
const { user, document } = agent;

await document.location = 'http://example.com';

const elem = document.querySelector('a');
await user.click(elem);

// get all Fetches that have occurred on the page thus far.
const allFetchResources = await user.waitForResource({
  type: 'Fetch',
});

const lastCommandId = user.lastCommandId;

const button = document.querySelector('#submit');
await user.click(button);

const xhrsAfterSubmit = await user.waitForResource(
  {
    type: 'Xhr',
  },
  {
    sinceCommandId: lastCommandId,
  },
);
```

### user.waitForElement*(element)* {#wait-for-element}

Wait until a specific element is present in the dom.

#### **Arguments**:

- element `SuperElement`
- options `object` Accepts any of the following:
  - timeoutMs `number`. Timeout in milliseconds
  - waitForVisible `boolean`. Wait until this element is visible.

#### **Returns**: `Promise`

If at the moment of calling this method, the selector already exists, the method will return immediately.

### user.waitForMillis*(millis)* {#wait-for-millis}

Waits for the specified number of milliseconds.

#### **Arguments**:

- millis `number`

#### **Returns**: `Promise`

### user.waitForWebSocket*(filename)* {#wait-for-websocket}

Waits until the specified web socket has been received.

#### **Arguments**:

- filename `number | RegExp`

#### **Returns**: `Promise<WebSocket>`

### user.exportProfile*()* {#export-profile}

Returns a json representation of this User for saving. This can later be restored into a browser instance using
`SecretAgent.createBrowser({ userProfile: serialized })`

#### **Returns**: `Promise<IUserProfile>`
