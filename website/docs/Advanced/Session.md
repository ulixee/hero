# Session

> A Session tracks a single "scraping" session. It tracks and coordinates the [HumanEmulator](./human-emulators), [BrowserEmulator](./browser-emulators) and [SecretAgent](../basic-interfaces/agent) that will be used.

Sessions store data into a Sqlite database using a module called SessionState. This database tracks all the information needed to recreate a session in [SessionReplay](./session-replay).

### Default Database Location

By default, session databases are located in `os.tmpdir()\.secret-agent`. Tmpdir refers to the NodeJs function in the [OS module](https://nodejs.org/api/os.html#os_os_tmpdir).
