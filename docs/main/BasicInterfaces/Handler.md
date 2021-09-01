# Handler

Handlers provide a simple interface to load-balance many concurrent Hero sessions across one or more `Hero Cores`.

```js
import { Handler } from '@ulixee/hero';

(async () => {
  const handler = new Handler();

  const hero = handler.createHero();
  await hero.goto('https://ulixee.org');

  async function getDatasetCost(hero: Hero) {
    const dataset = hero.input;
    await hero.goto(`https://ulixee.org${dataset.href}`);
    const cost = hero.document.querySelector('.cost .large-text');
    hero.output.cost = await cost.textContent;
  }

  const links = await hero.document.querySelectorAll('a.DatasetSummary');
  for (const link of links) {
    const name = await link.querySelector('.title').textContent;
    const href = await link.getAttribute('href');
    handler.dispatchHero(getDatasetCost, {
      name,
      input: {
        name,
        href,
      },
    });
  }

  const results = await handler.waitForAllDispatches(); 
  for (const result of results) {
    const cost = result.output.cost;
    const name = result.input.name;
    console.log('Cost of %s is %s', name, cost);
  }
  await handler.close();
})();
```

Handlers allow you to queue up actions to take as Heros become available. They'll automatically round-robin between available connections. It's a simple way to complete all your scrapes without overloading the local machine or remote browsers.

## Constructor

### new Handler*(...connections)* {#constructor}

The Handler constructor takes one or more "connections" to `Hero Core` instances.

`Cores` can be located remotely or in the same process. A remote connection includes a "host" parameter that will be connected to via tcp (and needs to be open on any firewalls).

Every connection controls how many maximum concurrent Heros should be open at any given time. Requests for Heros will be round-robined between all connections.

#### **Arguments**:

Connections can be either:

- options `object`. A set of settings that controls the creation of a [`connection`](/docs/advanced/connection-to-core#options) to a `Hero Core`.
  - host `string`. An optional `hostname:port` url that will be used to establish a connection to a Hero Core running on another machine. If no host is provided, a connection to a "locally" running `Core` will be attempted.
  - maxConcurrency `number`. The max number of Heros to allow to be dispatched and created at the same time. Heros are "active" until the dispatchHero callback is complete, or the created Hero is closed. If not provided, this number will match the max allowed by a `Core`.
  - heroTimeoutMillis `number`. The number of milliseconds to give each Hero in this connection to complete a session. A TimeoutError will be thrown if this time is exceeded.
  - localProxyPortStart `number` defaults to `any open port`. Starting internal port to use for the mitm proxy.
  - sessionsDir `string` defaults to `os.tmpdir()/.ulixee`. Directory to store session files and mitm certificates.
  - replayServerPort `number`. Port to start a live replay server on. Defaults to "any open port".
- connectionToCore [`ConnectionToCore`](/docs/advanced/connection-to-core#options). A pre-initialized connection to a `Hero Core`. You can use this option to pre-check your connection to a remote connection, or to provide customization to the connection.

```js
const { Handler } = require('@ulixee/hero');

(async () => {
  const remote = new RemoteConnectionToCore({
    host: '10.10.1.1:1588',
  });
  await remote.connect();

  const handler = new Handler(remote1, {
    host: '172.234.22.2:1586',
    maxConcurrency: 5,
  });

  const hero = await handler.createHero();
})();
```

## Properties

### handler.coreHosts {#core-hosts}

Readonly property returning the resolved list of coreHosts.

#### **Returns**: `Promise<string[]>`

### handler.defaultHeroOptions {#default-hero-properties}

Sets default properties to apply to any new Hero created. Accepts any of the configurations that can be provided to [`createHero()`](#create-hero).

#### **Returns**: `IHeroCreateOptions`

See the [Configuration](/docs/overview/configuration) page for more details on `options` and its defaults. You may also want to explore [BrowserEmulators](/docs/plugins/browser-emulators) and [HumanEmulators](/docs/plugins/human-emulators).

#### **Type**: [`Tab`](/docs/basic-interfaces/tab)

## Methods

### handler.addConnectionToCore*(options | connectionToCore)* {#add-connection}

Adds a connection to the handler. This method will call connect on the underlying connection.

Connection arguments are the same as the constructor arguments for a single connection.

#### **Arguments**:

Can be either:

- options `object`. A set of settings that controls the creation of a [`connection`](/docs/advanced/connection-to-core#options) to a `Hero Core`. (see [`constructor`](#constructor))
- connectionToCore [`ConnectionToCore`](/docs/advanced/connection-to-core#options). A pre-initialized connection to a `Hero Core`.

#### **Returns**: `Promise<void>`

### handler.closeConnectionToCore*(coreHost)* {#close-connection}

Closes and disconnects a connection from core. Heros "in-process" will throw `DisconnectedFromCoreError` on active commands.

#### **Arguments**:

- coreHost `string`. The coreHost connection.

#### **Returns**: `Promise<void>`

### handler.close*()* {#close}

Closes all underlying connections. NOTE: this function will "abort" any pending processes. You might want to call [`waitForAllDispatches()`](#wait-for-all-dispatches) first.

#### **Returns**: `Promise`

### handler.createHero*(options)* {#create-hero}

Creates a new [`Hero`](/docs/basic-interfaces/hero) using one of the `Core` connections initialized in this Handler. If there are no connections with availability (based on `maxConcurrency` setting), the returned promise will not return until one is free.

NOTE: when using this method, you must call [`hero.close()`](/docs/basic-interfaces/hero#close) explicitly to allow future Heros to be dispatched or created as needed.

#### **Arguments**:

- options `object`. Accepts any of the following:
  - name `string`. This is used to generate a unique sessionName.
  - browserEmulatorId `string` defaults to `default-browser-emulator`. Chooses the BrowserEmulator plugin which emulates the properties that help Hero look like a normal browser.
  - humanEmulatorId `string` defaults to `default-human-emulator`. Chooses the HumanEmulator plugin which drives the mouse/keyboard movements.
  - timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
  - locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
  - viewport `IViewport`. Sets the emulated screen size, window position in the screen, inner/outer width and height. If not provided, the most popular resolution is used from [statcounter.com](https://gs.statcounter.com/screen-resolution-stats/desktop/united-states-of-america).
  - blockedResourceTypes `BlockedResourceType[]`. Controls browser resource loading. Valid options are listed [here](/docs/overview/configuration#blocked-resources).
  - userProfile `IUserProfile`. Previous user's cookies, session, etc.
  - showReplay `boolean`. Whether or not to show the Replay UI. Can also be set with an env variable: `HERO_SHOW_REPLAY=true`.
  - input `object`. An object containing properties to attach to the hero (more frequently used with [`dispatchHero`](#dispatch-hero))
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. The optional "auth" should be included in the UserInfo section of the url, eg: `http://username:password@proxy.com:80`.

See the [Configuration](/docs/overview/configuration) page for more details on `options` and its defaults. You may also want to explore [BrowserEmulators](/docs/plugins/browser-emulators) and [HumanEmulators](/docs/plugins/human-emulators).

#### **Returns**: [`Promise<Hero>`](/docs/basic-interfaces/hero)

```js
const { Handler } = require('@ulixee/hero');

(async () => {
  const handler = new Handler({ maxConcurrency: 2 });

  const hero1 = await handler.createHero();
  const hero2 = await handler.createHero();

  setTimeout(() => hero2.close(), 100);

  // will be available in 100 ms when hero2 closes
  const hero3 = await handler.createHero();
})();
```

### handler.dispatchHero*(callbackFn, createHeroOptions?)* {#dispatch-hero}

This method allows you queue up functions that should be called as soon as a connection can allocate a new Hero. All configurations available to `createHero` are available here.

NOTE: you do not need to call close on an Hero when using this method. It will automatically be called when your callback returns.

On Disconnecting: if a Core is shut-down or the handler closes a coreConnection while work is still in-progress, the hero commands will throw a `DisconnectedFromCoreError`.

#### **Arguments**:

- callbackFn `(hero) => Promise`. An asynchronous function that will be passed an initialized [Hero](/docs/basic-interfaces/hero) with the given `createHeroOptions` configuration.
- createHeroOptions `object`. Options used to create a new hero. Takes all options available to [`createHero()`](#create-hero).

#### **Returns**: void

```js
const { Handler } = require('@ulixee/hero');

(async () => {
  const handler = new Handler({ maxConcurrency: 2 });

  handler.dispatchHero(
    async hero => {
      const { url } = hero.input;
      await hero.goto(url);
      const links = await hero.document.querySelectorAll('a');
      for (const link of links) {
        const href = await link.getAttribute('href');
        handler.dispatchHero(
          async hero0 => {
            await hero0.goto(hero0.input.link);
            const body = await hero0.document.body.textContent;
          },
          { input: { href } },
        );
      }
      // send in data
    },
    { input: { url: 'https://dataliberationfoundation.org' } },
  );

  // resolves when all dispatched heros are completed or an error occurs
  await handler.waitForAllDispatches();
  await handler.close();
})();
```

### handler.waitForAllDispatches*()* {#wait-for-all-dispatches}

Waits for all heros which have been created using `dispatchHero` to complete. If any errors are thrown by Heros, the first exception will be thrown upon awaiting this method.

#### **Returns**: `Promise<DispatchResult[]>`

- DispatchResult
  - sessionId `string key`. The session id assigned to the dispatched Hero.
  - name `string`. The name assigned to this session.
  - input `any`. Any input arguments passed to the dispatched Hero.
  - output `any?`. The object set to hero.output if no error thrown.
  - error `Error?`. An error if one has been thrown during dispatch.
  - options `CreateHeroOptions`. Any arguments passed to the dispatched Hero.

### handler.waitForAllDispatchesSettled*()* {#wait-for-all-dispatches-settled}

Waits for all heros which have been created using `dispatchHero` to complete or throw an error. This method will always wait for all dispatches to finish, regardless of errors thrown. This is different from `waitForAllDispatches`, which will throw on any dispatch errors.

#### **Returns**: `Promise<DispatchResult[]>`
