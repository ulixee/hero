# SecretAgent Client

This package is for internal use by packages that need to provide access to SecretAgent's client interface:

- full-client
- remote-client

There are two Generators (similar to how Noderdom generates classes), which creates two new classes (not class instances):

```js
import { SecretAgentGenerator, CoreClientGenerator } from '@secret-agent/client';

const CoreClient = CoreClientGenerator();
const SecretAgent = SecretAgentGenerator(CoreClient);
```

The SecretAgent class should be exported for external usage.

CoreClient is for internal use. It has three static methods that route commands and messages from SecretAgent Client to Core and vice-versa:

- pipeOutgoingCommand(fn: (meta: ISessionMeta | null, command: string, args: any[]) => Promise<any>)

- onEventFn: (meta: ISessionMeta, listenerId: string, eventArgs: any[]): void;
