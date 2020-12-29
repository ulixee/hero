# Troubleshooting

### Debugging Logs

By default SecretAgent logs everything to console.log, however you can inject your own logger so long as it supports four methods:
- `stats(action: string, data?: any, parentMessageId?: number)`
- `info(action: string, data?: any, parentMessageId?: number)`
- `warn(action: string, data?: any, parentMessageId?: number)`
- `error(action: string, data?: any, parentMessageId?: number)`

For example:

```js
const debug = require('debug')("MySecretAgent");

Agent.injectLogger({
  stats(action, data, parentMessageId) {
    debug(`STATS ${action}`, parentMessageId, data);
  },
  info(action, data, parentMessageId) {
    debug(`INFO ${action}`, parentMessageId, data);
  },
  warn(action, data, parentMessageId) {
    debug(`WARN ${action}`, parentMessageId, data);
  },
  error(action, data, parentMessageId) {
    debug(`ERROR ${action}`, parentMessageId, data);
  }
});
```

### Problems after an upgrade
If you have problems after upgrading, [let us know](https://github.com/ulixee/secret-agent/issues).
