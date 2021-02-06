# Session

> A Session tracks a single "scraping" session. It tracks and coordinates the [HumanEmulator](/docs/advanced/human-emulators), [BrowserEmulator](/docs/advanced/browser-emulators) and [SecretAgent](/docs/basic-interfaces/agent) that will be used.

Sessions store data into a Sqlite database using a module called SessionState. This database tracks all the information needed to recreate a session in [SessionReplay](/docs/advanced/session-replay).

### Default Database Location

By default, session databases are located in `os.tmpdir()\.secret-agent`. Tmpdir refers to the NodeJs function in the [OS module](https://nodejs.org/api/os.html#os_os_tmpdir).
