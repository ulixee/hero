# Introduction

> Hero is a free and open source headless browser that's written in NodeJs, built on top of Chrome and [nearly impossible for websites to detect](https://github.com/unblocked-web/double-agent/).

Hero is a web browser built for scraping.

- [x] **Built for scraping** - it's the first modern headless browsers designed specifically for scraping instead of just automated testing.
- [x] **Designed for web developers** - We've recreated a fully compliant DOM directly in NodeJS allowing you bypass the headaches of previous scraper tools.
- [x] **Powered by Chrome** - The powerful Chrome engine sits under the hood, allowing for lightning fast rendering.
- [x] **Emulates any modern browser** - Emulators make it easy to disguise your script as practically any browser.
- [x] **Avoids detection along the entire stack** - Don't be blocked because of TLS fingerprints in your networking stack.

Check out our [website for more details](https://ulixee.org).

## Installation

```shell script
npm i --save @ulixee/hero
```

or

```shell script
yarn add @ulixee/hero
```

## Usage

Hero provides access to the W3C DOM specification without the need for Puppeteer's complicated evaluate callbacks and multi-context switching:

```js
const Hero = require('@ulixee/hero');

(async () => {
  const hero = new Hero();
  await hero.goto('https://example.org');
  const title = await hero.document.title;
  const intro = await hero.document.querySelector('p').textContent;
  await hero.close();
})();
```

Browse the [full API docs](https://docs.ulixee.org/hero).

## Contributing

See [how-to-contribute.md](/docs/main/Contribute/how-to-contribute.md) for ways to get started.

This project has a [code of conduct](/docs/main/Contribute/code-of-conduct.md). By interacting with this repository, organization, or community you agree to abide by its terms.

We'd love your help in making Hero a better tool. Please don't hesitate to send a pull request.

## License

[MIT](LICENSE.md)
