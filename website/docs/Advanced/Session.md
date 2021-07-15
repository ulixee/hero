# Session

> A Session tracks a single "scraping" session. It tracks and coordinates the [HumanEmulator](/docs/plugins/human-emulators), [BrowserEmulator](/docs/plugins/browser-emulators) and [SecretAgent](/docs/basic-interfaces/agent) that will be used.

Sessions store data into a Sqlite database using a module called SessionState. This database tracks all the information needed to recreate a session in [SessionReplay](/docs/advanced/session-replay).

### Default Database Location

By default, session databases are located in `os.tmpdir()\.secret-agent`. Tmpdir refers to the NodeJs function in the [OS module](https://nodejs.org/api/os.html#os_os_tmpdir).

You can control the location sessions are stored using the [`sessionsDir`](/docs/overview/configuration#sessions-dir) configuration when starting a Core server.

### Managing Sessions

Session databases can grow rather large, since they store all DOM changes, Devtools messages and Http resources for all loaded tabs and frames in a "scraping session".

You should clean up any unwanted or unneeded session databases manually. You can safely discard any databases you do not want to inspect at any future point, or you can archive them to another location. Either approach will not impact future scripts. An archived or relocated Session database can still be replayed at a later date. 
