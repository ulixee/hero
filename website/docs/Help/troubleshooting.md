# Troubleshooting

### Installation Errors or ENOENT

SecretAgent operates with a few different spawned processes:

#### Socket Connect

Each socket created by the browser is proxied through a `Go` process that emulates the TLS signatures of the headed version of the browser engine being used. A small library is placed in `node_modules/@secret-agent/mitm-socket/dist` during installation. If this is unsuccessful, or aborts, you will see errors.

You can remove the library and reinstall or rebuild manually using npm run build in the `@secret-agent/mitm-socket` directory with environmental variable: `SA_REBUILD_MITM_SOCKET=true`.

#### Browser Emulators

When you install SecretAgent, it also downloads a recent version of Chromium 83 (~277MB Mac, ~282MB Linux, ~280MB Win). Each [BrowserEmulator](/docs/advanced/browser-emulators) you install (ie, Chrome80, Safari13) can install additional browser engines as needed.

Browsers will be saved to a shared location on each OS. Each browser version will be downloaded only once and can be shared across multiple SecretAgent npm installations.

- Mac: ~/Library/Cache/
- Linux: ~/.cache (environment variable XDG_CACHE_HOME)
- Windows: ~/AppData/Local (environment variable LOCALAPPDATA)

#### Replay

SecretAgent also installs an app called [Replay](/docs/advanced/session-replay) to debug and troubleshoot sessions. Replay is ~200MB unpacked. To skip download (ie, in a production environment), you can set the following environmental variable: `SA_REPLAY_SKIP_BINARY_DOWNLOAD=true`.

If you continue to have problems, [let us know](https://github.com/ulixee/secret-agent/issues).

### Debugging Logs

By default, SecretAgent logs everything to a [Session](/docs/advanced/session) database that is created per Agent instance. The SessionLogs table contains all debug logs.

To output logs to the console during operation, you can set the environmental variable `DEBUG=true`.

```js
process.env.DEBUG = true;
import agent from 'secret-agent';

(async () => {
  await agent.goto('https://url.com');
})();
```

If you'd like to customize log output, you can inject your own logger so long as it supports four methods:

- `stats(action: string, data?: ILogData)`
- `info(action: string, data?: ILogData)`
- `warn(action: string, data?: ILogData)`
- `error(action: string, data?: ILogData)`

For example:

```js
const debug = require('debug')('MySecretAgent');
const Logger = require('@secret-agent/commons/Logger')

Logger.injectLogger({
  stats(action, data) {
    debug(`STATS ${action}`, data);
  },
  info(action, data) {
    debug(`INFO ${action}`, data);
  },
  warn(action, data) {
    debug(`WARN ${action}`, data);
  },
  error(action, data) {
    debug(`ERROR ${action}`, data);
  },
});
```

### Problems after an upgrade

If you have problems after upgrading, [let us know](https://github.com/ulixee/secret-agent/issues).
