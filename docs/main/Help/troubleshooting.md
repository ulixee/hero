# Troubleshooting

### Installation Errors or ENOENT

Hero operates with a few different spawned processes:

#### Browser Emulators

When you install Hero, it also downloads a recent version of Chrome 83 (~277MB Mac, ~282MB Linux, ~280MB Win). Each [BrowserEmulator](/docs/hero/plugins/browser-emulators) you install (ie, Chrome80, Safari13) can install additional browser engines as needed.

Browsers will be saved to a shared location on each OS. Each browser version will be downloaded only once and can be shared across multiple Hero npm installations.

- Mac: ~/Library/Cache/
- Linux: ~/.cache (environment variable XDG_CACHE_HOME)
- Windows: ~/AppData/Local (environment variable LOCALAPPDATA)

### Debugging Logs

By default, Hero logs everything to a [Session](/docs/hero/advanced-concepts/sessions) database that is created per Hero instance. The SessionLogs table contains all debug logs.

To output logs to the console during operation, you can set the environmental variable `DEBUG=true`.

```js
process.env.DEBUG = true;
import Hero from '@ulixee/hero';

(async () => {
  const hero = new Hero();
  await hero.goto('https://url.com');
})();
```

If you'd like to customize log output, you can inject your own logger so long as it supports four methods:

- `stats(action: string, data?: ILogData)`
- `info(action: string, data?: ILogData)`
- `warn(action: string, data?: ILogData)`
- `error(action: string, data?: ILogData)`

For example:

```js
const debug = require('debug')('MyHero');
const Logger = require('@ulixee/commons/Logger')

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

If you have problems after upgrading, [let us know](https://github.com/ulixee/hero/issues).
