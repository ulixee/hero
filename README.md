# SecretAgent

SecretAgent is a web browser that's built for scraping. 

- [x] **Built for scraping** - it's the first modern headless browsers designed specifically for scraping instead of just automated testing.
- [x] **Designed for web developers** - We've recreated a fully compliant DOM directly in NodeJS allowing you bypass the headaches of previous scraper tools.
- [x] **Powered by Chromium** - The powerful Chromium engine sits under the hood, allowing for lightning fast rendering.
- [x] **Emulates any modern browser** - BrowserEmulators make it easy to disguise your script as practically any browser.
- [x] **Avoids detection along the entire stack** - Don't be blocked because of TLS fingerprints in your networking stack.

Check out our [website for more details](https://secretagent.dev).

## Installation

```shell script
npm i --save secret-agent
```

or

```shell script
yarn add secret-agent
```

## Usage

SecretAgent provides access to the W3C DOM specification without the need for Puppeteer's complicated evaluate callbacks and multi-context switching:

```js
const SecretAgent = require('secret-agent');

(async () => {
  const agent = await new SecretAgent();
  await agent.goto('https://example.org');
  const title = await agent.document.title;
  const intro = await agent.document.querySelector('p').textContent;
  await agent.close();
})();
```

Browse the [full API docs](https://secretagent.dev/docs).

## Contributing

We'd love your help in making SecretAgent a better tool. Please don't hesitate to send a pull request.

## License

[MIT](LICENSE.md)
