# Handler

Handlers provide a simple interface to load-balance many concurrent Agent sessions across one or more `SecretAgent Cores`.

```js
import { Handler } from 'secret-agent';

(async () => {
  const handler = new Handler();

  const agent = handler.createAgent();
  await agent.goto('https://ulixee.org');

  async function getDatasetCost(agent: Agent, dataset) {
    await agent.goto(`https://ulixee.org${dataset.href}`);
    const cost = agent.document.querySelector('.cost .large-text');

    console.log('Cost of %s is %s', dataset.name, await cost.textContent);
  }

  const links = await agent.document.querySelectorAll('a.DatasetSummary');
  for (const link of links) {
    const name = await link.querySelector('.title').textContent;
    const href = await link.getAttribute('href');
    handler.dispatchAgent(getDatasetCost, {
      name,
      href,
    });
  }

  await handler.waitForAllDispatches();
  await handler.close();
})();
```

Handlers allow you to queue up actions to take as Agents become available. They'll automatically round-robin between available connections. It's a simple way to complete all your scrapes without overloading the local machine or remote browsers.

## Constructor

### new Handler*(...connections)* {#constructor}

The Handler constructor takes one or more "connections" to `SecretAgent Core` instances.

`Cores` can be located remotely or in the same process. A remote connection includes a "host" parameter that will be connected to via tcp (and needs to be open on any firewalls).

Every connection controls how many maximum concurrent Agents should be open at any given time. Requests for Agents will be round-robined between all connections.

#### **Arguments**:

Connections can be either:

- options `object`. A set of settings that controls the creation of a [`connection`](/docs/advanced/connection-to-core#options) to a `SecretAgent Core`.
  - host `string`. An optional `hostname:port` url that will be used to establish a connection to a SecretAgent Core running on another machine. If no host is provided, a connection to a "locally" running `Core` will be attempted.
  - maxConcurrency `number`. The max number of Agents to allow to be dispatched and created at the same time. Agents are "active" until the dispatchAgent callback is complete, or the created Agent is closed. If not provided, this number will match the max allowed by a `Core`.
  - agentTimeoutMillis `number`. The number of milliseconds to give each Agent in this connection to complete a session. A TimeoutError will be thrown if this time is exceeded.
  - localProxyPortStart `number` defaults to `any open port`. Starting internal port to use for the mitm proxy.
  - sessionsDir `string` defaults to `os.tmpdir()/.secret-agent`. Directory to store session files and mitm certificates.
  - replayServerPort `number`. Port to start a live replay server on. Defaults to "any open port".
- connectionToCore [`ConnectionToCore`](/docs/advanced/connection-to-core#options). A pre-initialized connection to a `SecretAgent Core`. You can use this option to pre-check your connection to a remote connection, or to provide customization to the connection.

```js
const { Handler } = require('secret-agent');

(async () => {
  const remote = new RemoteConnectionToCore({
    host: '10.10.1.1:1588',
  });
  await remote.connect();

  const handler = new Handler(remote1, {
    host: '172.234.22.2:1586',
    maxConcurrency: 5,
    browserEmulatorIds: ['chrome-83'],
  });

  const agent = await handler.createAgent();
})();
```

## Properties

### handler.coreHosts {#core-hosts}

Readonly property returning the resolved list of coreHosts.

#### **Returns**: `Promise<string[]>`

### handler.defaultAgentOptions {#default-agent-properties}

Sets default properties to apply to any new Agent created. Accepts any of the configurations that can be provided to [`createAgent()`](#create-agent).

#### **Returns**: `IAgentCreateOptions`

See the [Configuration](/docs/overview/configuration) page for more details on `options` and its defaults. You may also want to explore [BrowserEmulators](/docs/advanced/browser-emulators) and [HumanEmulators](/docs/advanced/human-emulators).

#### **Type**: [`Tab`](/docs/basic-interfaces/tab)

## Methods

### handler.addConnectionToCore*(options | connectionToCore)* {#add-connection}

Adds a connection to the handler. This method will call connect on the underlying connection.

Connection arguments are the same as the constructor arguments for a single connection.

#### **Arguments**:

Can be either:

- options `object`. A set of settings that controls the creation of a [`connection`](/docs/advanced/connection-to-core#options) to a `SecretAgent Core`. (see [`constructor`](#constructor))
- connectionToCore [`ConnectionToCore`](/docs/advanced/connection-to-core#options). A pre-initialized connection to a `SecretAgent Core`.

#### **Returns**: `Promise<void>`

### handler.closeConnectionToCore*(coreHost)* {#close-connection}

Closes and disconnects a connection from core. Agents "in-process" will throw `DisconnectedFromCoreError` on active commands.

#### **Arguments**:

- coreHost `string`. The coreHost connection.

#### **Returns**: `Promise<void>`

### handler.close*()* {#close}

Closes all underlying connections. NOTE: this function will "abort" any pending processes. You might want to call [`waitForAllDispatches()`](#wait-for-all-dispatches) first.

#### **Returns**: `Promise`

### handler.createAgent*(options)* {#create-agent}

Creates a new [`Agent`](/docs/basic-interfaces/agent) using one of the `Core` connections initialized in this Handler. If there are no connections with availability (based on `maxConcurrency` setting), the returned promise will not return until one is free.

NOTE: when using this method, you must call [`agent.close()`](/docs/basic-interfaces/agent#close) explicitly to allow future Agents to be dispatched or created as needed.

#### **Arguments**:

- options `object`. Accepts any of the following:
  - name `string`. This is used to generate a unique sessionName.
  - browserEmulatorId `string` defaults to `chrome-83`. Emulates a specific browser engine version.
  - humanEmulatorId `string`. Drives human-like mouse/keyboard movements.
  - timezoneId `string`. Overrides the host timezone. A list of valid ids are available at [unicode.org](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/zone_tzid.html)
  - locale `string`. Overrides the host languages settings (eg, en-US). Locale will affect navigator.language value, Accept-Language request header value as well as number and date formatting rules.
  - viewport `IViewport`. Sets the emulated screen size, window position in the screen, inner/outer width and height. If not provided, the most popular resolution is used from [statcounter.com](https://gs.statcounter.com/screen-resolution-stats/desktop/united-states-of-america).
  - blockedResourceTypes `BlockedResourceType[]`. Controls browser resource loading. Valid options are listed [here](/docs/overview/configuration#blocked-resources).
  - userProfile `IUserProfile`. Previous user's cookies, session, etc.
  - showReplay `boolean`. Whether or not to show the Replay UI. Can also be set with an env variable: `SA_SHOW_REPLAY=true`.
  - upstreamProxyUrl `string`. A socks5 or http proxy url (and optional auth) to use for all HTTP requests in this session. The optional "auth" should be included in the UserInfo section of the url, eg: `http://username:password@proxy.com:80`.

See the [Configuration](/docs/overview/configuration) page for more details on `options` and its defaults. You may also want to explore [BrowserEmulators](/docs/advanced/browser-emulators) and [HumanEmulators](/docs/advanced/human-emulators).

#### **Returns**: [`Promise<Agent>`](/docs/basic-interfaces/agent)

```js
const { Handler } = require('secret-agent');

(async () => {
  const handler = new Handler({ maxConcurrency: 2 });

  const agent1 = await handler.createAgent();
  const agent2 = await handler.createAgent();

  setTimeout(() => agent2.close(), 100);

  // will be available in 100 ms when agent2 closes
  const agent3 = await handler.createAgent();
})();
```

### handler.dispatchAgent*(callbackFn, userArg?, createAgentOptions?)* {#dispatch-agent}

This method allows you queue up functions that should be called as soon as a connection can allocate a new Agent. All configurations available to `createAgent` are available here.

NOTE: you do not need to call close on an Agent when using this method. It will automatically be called when your callback returns.

On Disconnecting: if a Core is shut-down or the handler closes a coreConnection while work is still in-progress, the agent commands will throw a `DisconnectedFromCoreError`.

#### **Arguments**:

- callbackFn `(agent, userArg?) => Promise`. An asynchronous function that will be passed an initialized Agent and your userArg (if provided)
  - agent `Agent`. An `Agent` initialized with the options provided as `handler.defaultAgentOptions` and via `createAgentOptions` to the `dispatchAgent` method.
  - userArg `any`. Sends back your data if you provided any.
- userArg `any`. An optional parameter to pass into your callback.
- createAgentOptions `object`. Options used to create a new agent. Takes all options available to [`createAgent()`](#create-agent).

#### **Returns**: void

```js
const { Handler } = require('secret-agent');

(async () => {
  const handler = new Handler({ maxConcurrency: 2 });

  handler.dispatchAgent(async (agent, url) => {
    await agent.goto(url);
    const links = await agent.document.querySelectorAll('a');
    for (const link of links) {
      const href = await link.getAttribute('href');
      handler.dispatchAgent(async (agent0, link) => {
        await agent0.goto(link);
        const body = await agent0.document.body.textContent;
      }, href);
    }
    // send in data
  }, 'https://dataliberationfoundation.org');

  // resolves when all dispatched agents are completed or an error occurs
  await handler.waitForAllDispatches();
  await handler.close();
})();
```

### handler.waitForAllDispatches*()* {#wait-for-all-dispatches}

Waits for all agents which have been created using `dispatchAgent` to complete. If any errors are thrown by Agents, they will be thrown upon awaiting this method.

#### **Returns**: `Promise`
