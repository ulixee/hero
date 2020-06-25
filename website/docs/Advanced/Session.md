# Session

> A Session tracks a single "scraping" session. They track and coordinate the [Humanoid Plugin](./humanoids), [Emulator](./emulators), [Browser](../basic-interfaces/browser) and [User](../basic-interfaces/user) that will be used.

Sessions store data into a Sqlite database using a module called SessionState. This database tracks all the information needed to recreate a session in [SessionReplay](./session-replay)
