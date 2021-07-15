# Ulixee Hero

Hero is a web browser built for scraping. 

- [x] **Built for scraping** - it's the first modern headless browsers designed specifically for scraping instead of just automated testing.
- [x] **Designed for web developers** - We've recreated a fully compliant DOM directly in NodeJS allowing you bypass the headaches of previous scraper tools.
- [x] **Powered by Chrome** - The powerful Chrome engine sits under the hood, allowing for lightning fast rendering.
- [x] **Emulates any modern browser** - BrowserEmulators make it easy to disguise your script as practically any browser.
- [x] **Avoids detection along the entire stack** - Don't be blocked because of TLS fingerprints in your networking stack.

Check out our [website for more details](https://ulixee.org).

## Installation

```shell script
npm i --save ulixee
```

or

```shell script
yarn add ulixee
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

Browse the [full API docs](https://ulixee.org/docs).

## Contributing

We'd love your help in making Hero a better tool. Please don't hesitate to send a pull request.

## License

[MIT](LICENSE.md)
