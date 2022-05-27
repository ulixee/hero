# Migrating from SecretAgent

If you're migrating a script from SecretAgent, you can expect to find:

- a more developer-friendly set of APIs (like our [AwaitedDOM Extenders](/docs/hero/basic-interfaces/awaited-dom-extenders))
- a much better experience running in "headed" mode during development, while still supporting headless for production.
- features that let you react to the changing state/flow of a web page ([FlowHandlers](/docs/hero/basic-interfaces/flow))
- a much slimmer version of SecretAgent. Non-core functions have been exported: Remote is moved out to @ulixee/server; Replay is in a new tool called ChromeAlive!; the internal "Puppet" engine is now in the [Unblocked](https://github.com/unblocked-web/unblocked) project.

Otherwise, Hero is an evolution of SecretAgent (and started from a git fork). You'll mostly just need to copy/replace of `const { Agent } = require('secret-agent')` with `const Hero = require('@ulixee/hero')`.

```typescript
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

```typescript
import Hero from '@ulixee/hero';

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

## Server Setup

If you use a Client/Server Setup, you'll find that we moved the `Server` module out of Hero, and into [@ulixee/server][server]. You get the same functionality out of the box - a Server you can install on a machine and your DOM, interactions and other commands all serialize seamlessly.

## Handlers

Hero doesn't have a Handler or Server directly in the project. [@ulixee/server][server] is the new approach for setting up a remote Server, and we've decided to go a new direction for our preferred deployment strategy. The new strategy is called [Databoxes][databox], and greatly improves efficiency and has a much simpler remote deployment (well, it will soon :).

Databoxes focus on creating a remotely callable "function" that wraps a Hero script in a composable "unit". You can vary inputs and collect outputs, or retry a script from a new IP address without having to think much about how to do that yourself.

If you want to keep a model where you are using "driving" a script by queuing up a local "Client" that executes remotely (ie, like a SecretAgent Handler). To achieve client-size load-balancing, we recommend migrating to a tool like [`p-queue`](https://github.com/sindresorhus/p-queue). We've included an example in the Hero repo ([here](https://github.com/ulixee/hero/blob/27e1966c636f47519ed5d1ccc22273c1215855c1/examples/ulixee.org.ts)).

## BrowserEmulators and HumanEmulators

If you created a custom BrowserEmulator or HumanEmulator, those "concepts" have been merged into a single type of Plugin called an [Unblocked Plugin][unblocked-plugin]. You can see our plugins ported to the new format [here](https://github.com/unblocked-web/unblocked/plugins). We're planning to break up the BrowserEmulator into a series of smaller plugins with the end vision of making it far simpler to add workarounds as you find the need to add bot-blocker evasions.

## Puppet

To that end, the library that was formally passed into "Plugins" and "Human/Browser" Emulators has been merged with some parts of SecretAgent Core to form the [Unblocked Agent][unblocked-agent]. The Unblocked Agent is now under it's own development lifecycle and has been put into a much tighter loop with DoubleAgent (aka, detection) development. We envision Hero as the home of scraper productivity tooling, and Unblocked as the home of the bot cat and mouse game.

## Replay

If you were using Replay with SecretAgent (sorry Windows users...), it's now part of the new ChromeAlive! tooling. You can download the [Ulixee.app](https://github.com/ulixee/ulixee/releases/latest) install, or you can add `@ulixee/apps-chromealive-core` and `@ulixee/server` to your `devDependencies` and start a local server. This will add a bar to a headed version of Chrome when you're developing.

[server]: https://ulixee.org/docs/server
[unblocked-plugin]: https://github.com/unblocked-web/specifications
[unblocked-agent]: https://github.com/unblocked-web/agent
