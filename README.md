# Ulixee Hero

A few cool highlights about Hero:

- [x] **Built for scraping** - it's the first modern headless browsers designed specifically for scraping instead of just automated testing.
- [x] **Designed for web developers** - We've recreated a fully compliant DOM directly in NodeJS allowing you bypass the headaches of previous scraper tools.
- [x] **Powered by Chrome** - The powerful Chrome engine sits under the hood, allowing for lightning fast rendering.
- [x] **Emulates any modern browser** - Emulators make it easy to disguise your script as practically any browser.
- [x] **Avoids detection along the entire stack** - Don't be blocked because of TLS fingerprints in your networking stack.

Check out our [website for more details](https://ulixee.org).

## Installation

You can get a playground started with Hero very quickly. A playground is a one-time use hero instance that will shut down once you've run a single script. This is great for quick scripts or testing.

```shell script
npm i --save @ulixee/hero-playground
```

Once you're ready to graduate to deploying, check out the docs here: [Deploying Hero](https://ulixee.org/docs/hero/advanced-concepts/deployment).

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

Browse the [full API docs](https://ulixee.org/docs/hero).

## Using this Repository

This is a Monorepo to work on the Browser Detect + Evade workflow of building an automated engine. It requires Yarn workspaces.

You can work with the project by:

1. Cloning the repository and installing git submodules (you can add --recursive to your initial clone request).
2. Run `yarn build`. NOTE: you must run this command to build typescript files.

### Using devenv for an isolated development sandbox (using nix)

Using this setup everything will be automatically installed with the exact same versions for everyone. This avoids a lot of installation issues, and can help automate a lot of boring setup jobs.

1. [Install nix ](https://determinate.systems/posts/determinate-nix-installer/)
2. [Install devenv](https://devenv.sh/getting-started/#1-install-nix)
3. [Install direnv ](https://direnv.net/docs/installation.html). Only needed if you want everything the auto load.
4. [Make sure direnv works with zsh or other shell ](https://direnv.net/docs/hook.html)

### Browser Profiles

If you want to work with profiles (ie, update Emulator Data, generate Double Agent probes, etc), you'll need to download the BrowserProfiles data: `$ yarn workspace @ulixee/unblocked-browser-profiler downloadData`. This will clone data into a folder called `browser-profile-data` adjacent to the `unblocked` folder.

## Unblocked

This project maintains a suite of tools for protecting the web's open knowledge. Its primary function is to create a web-scraping engine that mimics a human interacting with a website - both from a user behavior, as well as from a "browser" perspective.

### Unblocked Projects

This repository is home to several of the projects needed to create an "unblocked" automated browser engine. We imagine a world where there are many participants sharing evasions and emulations for all the web features into a [single repository](./plugins). They will live right next to an advanced bot blocking [detection engine][double-agent] that can analyze every facet of a web scraping session (TCP, TLS, HTTP, DOM, User Interactions, etc). A [profiler](./browser-profiler) that can run all [detections][double-agent] using real browser/operating systems to generate [profiles][profiles] of true browser signatures. And an implementation of an [agent][agent] that can run all the evasions and run unblocked.

- [Specifications][spec]. This contains generic specifications for what an automated browser needs to expose so that it can be hooked into to emulate a normal, headed browser engine. To properly mask the differences between headless Chrome on a linux machine, and a headed Chrome running on a home operating system, a series of "hooks" needs to be exposed. These include things like before browsers start, web pages launch, and web workers have a javascript environment. This specification will be the minimum spec needed to open up the browser to plugin authors.
- [JsPath][jspath]. A specification is provided for a method to serialize DOM nodes, properties and visibility information so it can be remotely queried.
- [Agent][agent]. A basic automated engine that implements the full reference [Specifications][spec].
- [Plugins](./plugins). Unblocked community plugins that enhance a browser to mask Browser, Network, User Interaction and Operating System "markers" that can be used to block web scrapers.
- [DoubleAgent][double-agent]. A series of tests that can be run to analyze real Browsers on real machines, and then compare all the detected markers to an automated setup.
- [DoubleAgent Stacks](./double-agent-stacks). Runners for common scraper stacks. This can also serve as a workflow example for your own stack.
- [Real User Agents][real-user-agents]. A library that collects real Chromium releases and UserAgent strings collected from real browsers. This is used to generate UserAgent strings for various combinations of Browsers and Operating Systems.
- [Browser Profile Data][profiles]. A data repository containing profiles of real browsers using BrowserStack, Dockers and Local Doms. Includes deep diffing various environments of Chrome (headed, headless, with devtools, browserstack, between runs, etc).
- [Browser Profiler](./browser-profiler). Profiler to automatically collect [Browser Profile Data][profiles]. Automation to recreate files is driven from Profile Data project.
- [Emulator Builder](./browser-emulator-builder). A library to use the collected data from Browser Profile Data to "patch" runtime headless Chrome to match headed Chrome on a home Operating System.
- [Mission Impossible]. Real world measurement of what DOM Apis are being analyzed on the top websites, and how many are detecting and blocking the Unblocked Agent + Community Plugins. _To be imported_

## Questions

Join us on the [Ulixee Discord](https://discord.gg/tMAycnemHU) for any questions or comments (it's a sister project).

## Contributing

See [How to Contribute](https://ulixee.org/how-to-contribute) for ways to get started.

This project has a [Code of Conduct](https://ulixee.org/code-of-conduct). By interacting with this repository, organization, or community you agree to abide by its terms.

We'd love your help in making Hero a better tool. Please don't hesitate to send a pull request.

## License

[MIT](LICENSE.md)
