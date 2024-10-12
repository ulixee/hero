# Migrating from SecretAgent

If you're migrating a script from SecretAgent, you can expect to find:

- a more developer-friendly set of APIs (like our [AwaitedDOM Extenders](../basic-client/awaited-dom-extensions.md))
- a much better experience running in "headed" mode during development, while still supporting headless for production.
- features that let you react to the changing state/flow of a web page ([FlowHandlers](../basic-client/flow-handling.md))
- a much slimmer version of SecretAgent. Non-core functions have been exported: Remote is moved out to @ulixee/cloud; Replay is in a new tool called ChromeAlive!; the internal "Puppet" engine is now in the [Unblocked](https://github.com/ulixee/unblocked) project.

Otherwise, Hero is an evolution of SecretAgent (and started from a git fork). You'll mostly just need to copy/replace of `const { Agent } = require('secret-agent')` with `const Hero = require('@ulixee/hero-playground')`.

```js
import { Agent } from 'secret-agent';

async function run() {
  const agent = new Agent();
  await agent.goto('https://example.org/');
  await agent.waitForPaintingStable();

  const html = await agent.document.documentElement.outerHTML;
  const title = await agent.document.title;
  const intro = await agent.document.querySelector('p').textContent;
  await agent.close();
}

run().catch(error => console.log(error));
```

```js
import Hero from '@ulixee/hero-playground';

async function run() {
  const hero = new Hero();
  await hero.goto('https://example.org/');
  await hero.waitForPaintingStable();

  const html = await hero.document.documentElement.outerHTML;
  const title = await hero.document.title;
  const intro = await hero.querySelector('p').textContent;
  await hero.close();
}

run().catch(error => console.log(error));
```

## No more Default Agent

If you were using the default "Agent" from `const agent = require('secret-agent')`, you'll need to move to a mode of constructing a Hero object for each session.

## Client Library

## Server Setup

If you use a Client/Server Setup, you'll find that we moved the `Server` module out of SecretAgent, and into [@ulixee/cloud][cloud]. You get the same functionality out of the box - a Server you can install on a machine and your DOM, interactions and other commands all serialize seamlessly.

To avoid installing the whole Chrome infrastructure on your client side, you can use the light client - `npm i @ulixee/hero`. It's the equivalent of `@secret-agent/client`.

## Handlers

Hero doesn't have a Handler or Server directly in the project. [@ulixee/cloud][cloud] is the new approach for setting up a remote server, and we've decided to go a new direction for our preferred deployment strategy. The new strategy is called [Datastores][datastore], and greatly improves efficiency and has a much simpler remote deployment (well, it will soon :).

Datastores focus on creating a remotely callable "function" that wraps a Hero script in a composable "unit". You can vary inputs and collect outputs, or retry a script from a new IP address without having to think much about how to do that yourself.

If you want to keep a model where you are using "driving" a script by queuing up a local "Client" that executes remotely (ie, like a SecretAgent Handler). To achieve client-size load-balancing, we recommend migrating to a tool like [`p-queue`](https://github.com/sindresorhus/p-queue). We've included an example in the Hero repo ([here](https://github.com/ulixee/hero/blob/27e1966c636f47519ed5d1ccc22273c1215855c1/examples/ulixee.org.ts)).

## BrowserEmulators and HumanEmulators

If you created a custom BrowserEmulator or HumanEmulator, those "concepts" have been merged into a single type of Plugin called an [Unblocked Plugin][unblocked-plugin]. You can see our plugins ported to the new format [here](https://github.com/ulixee/hero/tree/main/plugins). We're planning to break up the BrowserEmulator into a series of smaller plugins with the end vision of making it far simpler to add workarounds as you find the need to add bot-blocker evasions.

## Puppet

To that end, the library that was formally passed into "Plugins" and "Human/Browser" Emulators has been merged with some parts of SecretAgent Core to form the [Unblocked Agent][unblocked-agent]. The Unblocked Agent is now under it's own development lifecycle and has been put into a much tighter loop with DoubleAgent (aka, detection) development. We envision Hero as the home of scraper productivity tooling, and Unblocked as the home of the bot cat and mouse game.

## Plugins

If you wrote a Core Plugin, you'll notice that the API callbacks have changed slightly. Callbacks and variables no longer have "puppet" in the name, since they're now part of [Unblocked Agent][unblocked-agent].

## Replay

If you were using Replay with SecretAgent (sorry Windows users...), it's now part of the new Ulixee Desktop tooling. You can download the [Ulixee.app](https://github.com/ulixee/desktop/releases/latest) install.


[cloud]: https://ulixee.org/docs/cloud
[unblocked-plugin]: https://github.com/ulixee/hero/tree/main/specification
[unblocked-agent]: https://github.com/ulixee/hero/tree/main/agent
