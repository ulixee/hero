# ConnectionToCore

> ConnectionToCore is a built-in mechanism to stream commands to local and remote instances of SecretAgent using the same simple interface.

When you install SecretAgent, it comes ready to run locally with a Chromium engine and client all in your local codebase. However, as you begin to scale the number of concurrent scrapes, you will end up needing to manage a fleet of "engines" running on a number of computers.

```javascript
const { Agent: BaseAgent } = require('@secret-agent/client');
const { Agent: FullAgent } = require('@secret-agent');

(async () => {
  const local = new FullAgent(); // connects to full, local installation
  const remote = new BaseAgent({
    connectionToCore: new RemoteConnectionToCore({
      host: '192.168.1.1:3444',
    }),
  });
})().catch(console.log);
```

There are 2 built-in connections in SecretAgent:

- `Default` - instantiates and connects to a locally install SecretAgent `Core`
- `RemoteConnectionToCore` - takes a host to dial over tcp. See more [here](./remote)


### Configuration {#configuration}

When you provide a connectionToCore to a [Handler](../basic-interfaces/handler) or [Agent](../basic-interfaces/agent), SecretAgent will accept either an `options` object or a `RemoteConnectionToCore` instance.

The following methods allow you to configure the `connectionToCore`
- [agent.configure()](../basic-interfaces/agent#configure) - apply the connection to the default agent, or to a an agent constructed prior to the first connection.
- [new Agent()](../basic-interfaces/agent#constructor) - the new agent will use this connection.
- [new Handler(...connections)](../basic-interfaces/handler#constructor) - a handler takes one or more coreClientConnection options or instances.  


### Options {#options}

The provided settings configure the connection to `Core`. Note: some configurations will apply to all connected Agents and Handlers (`localProxyPortStart`, `sessionsDir`, `replayServerPort`).

- options `object`. A set of settings that controls the creation of a "connection" to a `SecretAgent Core`.
  - host `string`. An optional `hostname:port` url that will be used to establish a connection to a SecretAgent Core running on another machine. If no host is provided, a connection to a "locally" running `Core` will be attempted.
  - maxConcurrency `number`. The max number of Agents to allow to be dispatched and created at the same time. Agents are "active" until the dispatchAgent callback is complete, or the created Agent is closed. If not provided, this number will match the max allowed by a `Core`.
  - agentTimeoutMillis `number`. The number of milliseconds to give each Agent in this connection to complete a session. A TimeoutError will be thrown if this time is exceeded.
  - localProxyPortStart `number` defaults to `any open port`. Starting internal port to use for the mitm proxy.
  - sessionsDir `string` defaults to `os.tmpdir()/.secret-agent`. Directory to store session files and mitm certificates.
  - replayServerPort `number`. Port to start a live replay server on. Defaults to "any open port".
- connection `CoreClientConnection`. A pre-initialized connection to a `SecretAgent Core`. You can use this option to pre-check your connection to a remote connection, or to provide customization to the connection.
