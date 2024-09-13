This is what we previously had...

```js
const userAgentString = ctx.session.userAgentString;

const browserKey = createBrowserIdFromUserAgentString(userAgentString);
const browserPct = new Browsers().getByKey(browserKey)?.desktopPercent ?? 0.1;

const osKey = createOsIdFromUserAgentString(userAgentString);
const osPct = new Oses().getByKey(osKey)?.desktopPercent ?? 0.1;

// 2% frequency means 2 in 100 requests, ie, 50% chance a single request is a bot
// 1% frequency means 1 in 100, ie 100/1 = 100%
// 0.5% means 0.5 in 100 = 200%?
const browserBotPct = Math.min(Math.floor(100 / browserPct / 2), 50);
const osBotPct = Math.min(Math.floor(100 / osPct / 2), 50);
```
