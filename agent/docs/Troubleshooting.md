# Troubleshooting

### Installation Errors or ENOENT

Unblocked Agent operates with a few different spawned processes:

#### Socket Connect

Each socket created by the browser is proxied through a `Go` process that emulates the TLS signatures of the headed version of the browser engine being used. A small library is placed in `node_modules/@ulixee/unblocked-agent-mitm-socket/dist` during installation. If this is unsuccessful, or aborts, you will see errors.

You can remove the library and reinstall or rebuild manually using npm run build in the `@ulixee/unblocked-agent-mitm-socket` directory with environmental variable: `ULX_MITM_REBUILD_SOCKET=true`.

#### Chrome Browser

When you install Unblocked Agent, it also downloads a recent version of Chrome (~277MB Mac, ~282MB Linux, ~280MB Win).

Browsers will be saved to a shared location on each OS. Each browser version will be downloaded only once and can be shared across multiple Agent npm installations.

- Mac: ~/Library/Cache/
- Linux: ~/.cache (environment variable XDG_CACHE_HOME)
- Windows: ~/AppData/Local (environment variable LOCALAPPDATA)

### Debugging Logs

The built-in Logger is setup to route logs to a given "SessionId" for each Agent, Pool or any other separator you wish. See the [TestLogger](../testing/TestLogger.ts) setup for an example.

A few built-in log settings are available:
`DEBUG=ubk*` - will print all Unbreakable logs
`DEBUG=ubk:devtools` - logs devtools logs for Unbreakable
`DEBUG=ubk:mitm` - includes mitm logs.
