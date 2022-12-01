# Sessions

> A Session tracks and coordinates a single "scraping" session. It manages the fingerprints, browser settings, and plugins that [Hero](../basic-client/hero.md) uses.

Hero's session logic is managed in the [Core](./client-vs-core.md), with only a minimal amount of session data exposed in the Client. All session data is stored in a Sqlite database using a module called SessionState. This database tracks all the information needed for many of Hero's advanced features, such as [TimeTravel](./time-travel.md).

### Default Database Location

By default, session databases are located in `os.tmpdir()\.ulixee`. Tmpdir refers to the NodeJs function in the [OS module](https://nodejs.org/api/os.html#os_os_tmpdir).

You can control the location sessions are stored using the [`dataDir`](../overview/configuration.md#data-dir) configuration when starting a Core.

### Managing Sessions

Session databases can grow rather large, since they store all DOM changes, Devtools messages and Http resources for all loaded tabs and frames in a "scraping session".

You should clean up any unwanted or unneeded session databases manually. You can safely discard any databases you do not want to inspect at any future point, or you can archive them to another location. Either approach will not impact future scripts. An archived or relocated Session database can still be replayed at a later date. 

You can subscribe to closed Session databases for automated cleanup (this will run wherever your Core is running).

```js
import { Session } from '@ulixee/hero-core';
import * as Fs from 'fs'

Session.events.on('closed', ({ id, databasePath }) => {
  // NOTE: determine if database should be kept (track session ids vs errors on your own)
  if (!didHaveErrors(id)) {
    Fs.unlink(databasePath);
  }
});
```
