# Introduction

> SecretAgent is a free and open source headless browser that's written in NodeJs, built on top of Chromium and [nearly impossible for websites to detect](https://github.com/ulixee/double-agent/).

## Why SecretAgent?

- **Built for scraping** - it's the first modern headless browsers designed specifically for scraping instead of just automated testing.
- **Designed for web developers** - We've recreated a fully compliant DOM directly in NodeJS allowing you bypass the headaches of previous scraper tools.
- **Powered by Chromium** - The powerful Chromium engine sits under the hood, allowing for lightning fast rendering.
- **Emulates any modern browser** - Emulator plugins make it easy to disguise your script as practically any browser.
- **Avoids detection along the entire stack** - Don't be blocked because of TLS fingerprints in your networking stack.

## How It Works

We started by challenging ourselves to create the ultimate scraper detection tool, which we coined [DoubleAgent](https://github.com/ulixee/double-agent/). Along the way we discovered 76,697 checks that any website can implement to [block practically all known scrapers](https://stateofscraping.org). Then we designed SecretAgent to bypass detection by emulating real users.

SecretAgent uses Chromium as its core rendering engine under the hood, with DevTools Protocol as its glue layer.

Instead of creating another complex puppeteer-like API that requires use of nested callbacks and running code in remote contexts, we designed the AwaitedDOM. AwaitedDOM is a W3C compliant DOM written for NodeJS that allows you to write scraper scripts as if you were inside the webpage.

## Installation

To use SecretAgent in your project, install it with npm or yarn:

```bash
npm i --save secret-agent
```

or

```bash
yarn add secret-agent
```

Note: When you install SecretAgent, it also downloads a recent version of Chromium 83 (~277MB Mac, ~282MB Linux, ~280MB Win). Each [emulator](/docs/advanced/emulators) you install (ie, Chrome80, Safari13) can install additional browser engines as needed.

Browsers will be saved to a shared location on each OS. Each browser version will be downloaded only once and can be shared across multiple Secret Agent npm installations.

- Mac: ~/Library/Cache/
- Linux: ~/.cache (environment variable XDG_CACHE_HOME)
- Windows: ~/AppData/Local (environment variable LOCALAPPDATA)

Secret Agent also installs an app called [Replay](/docs/advanced/session-replay) to debug and troubleshoot sessions. Replay is ~200MB unpacked. To skip download (ie, in a production environment), you can set the following environmental variable: `SA_REPLAY_SKIP_BINARY_DOWNLOAD=true`.

## Usage Example

SecretAgent's API should be familiar to web developers everywhere. We created a W3C compliant DOM library for Node, which allows you to use the exact same DOM selector and traversal commands as you do in modern web browsers like Chromium, Firefox, and Safari.

For example, here's how you might extract the title and intro paragraph from example.org:

```js
const SecretAgent = require('secret-agent');

(async () => {
  const agent = new SecretAgent();
  await agent.goto('https://example.org');
  const title = await agent.document.title;
  const intro = await agent.document.querySelector('p').textContent;
  await agent.close();

  console.log('Retrieved from https://example.org', {
    title,
    intro,
  });
})();
```

As shown in the example above, window.document follows the standard DOM specification, but with a cool twist which we call the AwaitedDOM.
