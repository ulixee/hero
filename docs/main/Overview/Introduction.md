# Introduction

> Hero is a free and open source headless browser that's written in NodeJs, built on top of Chrome, and designed for easy and reliable scraping.

A few cool highlights about Hero:

- [x] **Built for scraping** - it's the first modern headless browsers designed specifically for scraping instead of just automated testing.
- [x] **Designed for web developers** - We've recreated a fully compliant DOM directly in NodeJS allowing you bypass the headaches of previous scraper tools.
- [x] **Powered by Chrome** - The powerful Chrome engine sits under the hood, allowing for lightning fast rendering.
- [x] **Emulates any modern browser** - Emulators make it easy to disguise your script as practically any browser.
- [x] **Avoids detection along the entire stack** - Don't be blocked because of TLS fingerprints in your networking stack.

## Installation

To get started using Hero in your project, we have a "playground" that allows you to run examples out of the box. It can be installed using the following commands:

```bash
npm i --save @ulixee/hero-playground
```

or

```bash
yarn add @ulixee/hero-playground
```

You can drop the "-playground" whenever you want and use Hero directly (the core functionality is exactly the same). Just make sure your Ulixee development environment is setup and ready to go, such as making sure [`@ulixee/server`](/docs/server) is installed and running:

```bash
npm i --save @ulixee/hero
```

or

```bash
yarn add @ulixee/hero
```

## Usage

Hero provides access to the W3C DOM specification without the need for Puppeteer's complicated evaluate callbacks and multi-context switching:

```js
const Hero = require('@ulixee/hero-playground');

(async () => {
  const hero = new Hero();
  await hero.goto('https://example.org');
  const title = await hero.document.title;
  const intro = await hero.document.querySelector('p').textContent;
  await hero.close();
})();
```

## Contributing

See [How to Contribute](/how-to-contribute) for ways to get started.

This project has a [Code of Conduct](/code-of-conduct.md). By interacting with this repository, organization, or community you agree to abide by its terms.

We'd love your help in making Hero a better tool. Please don't hesitate to send a pull request.
