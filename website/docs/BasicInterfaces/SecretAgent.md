# SecretAgent

This is the primary entry point for launching SecretAgent. The following is a simple example:

```js
const SecretAgent = require('secret-agent');

(async () => {
  const browser = await SecretAgent.createBrowser();
  await browser.goto('https://www.google.com');
  // other actions...
  await browser.close();
})();
```

SecretAgent itself has no instances. It is a static singleton whose primary purpose is spinning up new [browser instances](./browser-window).

## Class Methods

### SecretAgent.configure*(options)* {#configure}

Update existing settings.

#### **Arguments**:

- options `object` Accepts any of the following:
  - maxActiveSessionCount `number` defaults to `10`. Limit windows open at any given time.
  - localProxyPortStart `number` defaults to `10000`. Starting proxy port.
  - sessionsDir `string` defaults to `/tmp`. Where session files are stored.
  - defaultRenderingOptions `string[]` defaults to `[All]`. Controls browser functionality.
  - defaultUserProfile `IUserProfile`. Define user cookies, session, and more.

#### **Returns**: `Promise`

See the [Configuration](../overview/configuration) page for more details on `options` and its defaults.

Note: Changing any of these configurations options after `createBrowser` has been called will not affect any windows already created. It only affects future windows.

### SecretAgent.createBrowser*(\[options])* {#create-browser}

Creates a new sandboxed browser instance with [unique user session and fingerprints](../overview/basic-concepts). Or pass in an existing UserProfile.

#### **Arguments**:

- options `object` Accepts any of the following:
  - name `string`. This is used to generate a unique sessionName.
  - emulatorId `string`. Emulates a specific browser version.
  - humanoidId `string`. Drives human-like mouse/keyboard movements.
  - renderingOptions `string[]`. Controls browser functionality.
  - userProfile `IUserProfile`. Previous user's cookies, session, etc.

#### **Returns**: `Promise<BrowserInstance>`

See the [Configuration](../overview/configuration) page for more details on `options` and its defaults.

Note: If you provide a `name` that has already been used to name another Browser instance then a counter will be appended to your string to ensure it's uniqueness. However, it's only unique within a single NodeJs process (i.e., rerunning your script will reset the counter).

The following example code loads a URL with the AwaitedDOM activated but without any javascript executed or assets loaded (i.e., css, images, etc):

```js
const SecretAgent = require('secret-agent');

(async () => {
  const browser = await SecretAgent.createBrowser({ renderingOptions: ['AwaitedDOM'] });
  await browser.goto('https://example.org');
  const html = await browser.document.outerHTML;
  await SecretAgent.shutdown();
})();
```

### SecretAgent.shutdown*()* {#shutdown}

Close SecretAgent and any windows that have been opened.

#### **Returns**: `Promise`

After shutdown, the SecretAgent object is considered to be disposed and cannot be used again unless you call SecretAgent.start() to reinitialize.

Note: Because Chromium is launched when you call `start/createBrowser`, your NodeJS script cannot exit cleanly until `shutdown()` completes.

### SecretAgent.start*(\[options])* {#start}

Preloads the library and launches the underlying Chromium engine.

#### **Arguments**:

- options `object`. Accepts any of the options in [SecretAgent.configure]().

#### **Returns**: `Promise`

Starting SecretAgent can take between 5 and 15 seconds. It must launch the Chromium engine, set up man-in-the-middle proxies, and prime the Emulators and Humanoids.

Note: You are not required to call this method as `createBrowser` will do so the first time it runs. Directly calling `start` merely speeds up the response time of your first call to `createBrowser`.
