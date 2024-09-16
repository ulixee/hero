# Troubleshooting

### Installation Errors or ENOENT

Hero operates with a few different spawned processes:

#### Browser Emulators

When you install Hero, it also downloads a recent version of Chrome and emulator "data files" to mask automated and headless usage. Details of the underlying [Browser Emulators]](https://github.com/ulixee/hero/tree/main/plugins/default-browser-emulator) can be found in the [Unblocked](https://github.com/ulixee/unblocked) project.

Browsers will be saved to a shared location on each OS. Each browser version will be downloaded only once and can be shared across multiple Hero npm installations.

- Mac: ~/Library/Cache/
- Linux: ~/.cache (environment variable XDG_CACHE_HOME)
- Windows: ~/AppData/Local (environment variable LOCALAPPDATA)

### Debugging Logs

By default, Hero logs everything to a [Session](../advanced-concepts/sessions.md) database that is created per Hero instance. The SessionLogs table contains all debug logs.

To output logs to the console during operation, you can set the environmental variable `DEBUG=true`.

```js
process.env.DEBUG = true;
import Hero from '@ulixee/hero';

(async () => {
  const hero = new Hero();
  await hero.goto('https://url.com');
})();
```

If you'd like to customize log output, you can inject your own logger so long as it supports these methods:
- `boundContext: any;`: the context data bound to the given logger
- `stats(action: string, data?: ILogData): number`
- `info(action: string, data?: ILogData): number`
- `warn(action: string, data?: ILogData): number`
- `error(action: string, data?: ILogData): number`
- `createChild(module: NodeModule, boundContext: any): ILog` Must return a new logger that retains the given boundContext state.


_*NOTE:*_ you must initialize this Logger BEFORE any Hero code is accessed.

For example:

```js
const debug = require('debug')('MyHero');
const Logger = require('@ulixee/commons/Logger');

let logId = 0;

class CustomLogger {
  boundContext: any;
  level: string;
  constructor(module, boundContext) {
    this.boundContext = boundContext;
    this.filename = module.filename;
  }
  stats(action, data) {
    debug(`STATS ${action}`, data);
    return (logId += 1);
  }
  info(action, data) {
    debug(`INFO ${action}`, data);
    return (logId += 1);
  }
  warn(action, data) {
    debug(`WARN ${action}`, data);
    return (logId += 1);
  }
  error(action, data) {
    debug(`ERROR ${action}`, data);
    return (logId += 1);
  }
  createChild(module, boundContext) {
    const Constructor = this.constructor;
    // @ts-ignore
    return new Constructor(module, {
      ...this.boundContext,
      ...boundContext,
    });
  }
  flush() {}
}

injectLogger(module => {
  return {
    log: new CustomLogger(module),
  };
});
```

From your main script:

```
require('./CustomLogger.js');
const HeroCore = require('@ulixee/hero-core');

// your code...

```

### Problems after an upgrade

If you have problems after upgrading, [let us know](https://github.com/ulixee/hero/issues).
