# Unblocked Agent

Unblocked Agent is an automated web browser that's built to be controlled from every facet by a developer. It fully implements the Unblocked Agent [specifications][spec], which is a generic plug-in structure to support common Bot detection evasions. When combined with the [Unblocked Plugins][plugins], the Unblocked Agent is very difficult to block.

- [x] **Powered by Chrome** - The powerful Chrome engine sits under the hood, allowing for lightning fast rendering.
- [x] **Hook in at Every Level of the Stack** - Hooks are defined in the network layer (TCP, TLS, HTTP, HTTP2), browser level and user interactions. You have full control of Chrome Devtools API all along the way.
- [x] **Track Nodes with [JsPath][jspath]** - Uses the JsPath specification to query and track DOM Nodes.
- [x] **Supports the [Unblocked Specification][spec]** - Plug-in [Bot Evasions][plugins] and [Human Emulators][human], or build your own.

## Installation

```shell script
npm i --save @ulixee/unblocked-agent
```

or

```shell script
yarn add @ulixee/unblocked-agent
```

## Usage

```js
const { Agent } = require('@ulixee/unblocked-agent');

(async () => {
  const agent = new Agent();
  const page = await agent.newPage();
  await page.goto('https://example.org/');
  await page.waitForLoad('PaintingStable');

  const outerHTML = await page.mainFrame.outerHTML();
  const title = await page.evaluate('document.title');
  const intro = await page.evaluate(`document.querySelector('p').textContent`);

  await agent.close();
})();
```

## Core Concepts

Detailed documentation is available in `/docs`. A few high level classes are described below: 

### Agent

Agents are the primary interface to work with Unblocked Agent. An Agent will coordinate a Man-in-the-Middle proxy and an Incognito window to create a sandboxed web scraping session. Agents support [Unblocked Plugins][plugins] to enhance user interaction behavior or add bot evasions.

### Pool

A Pool allows you to share an underlying Browser (ie, Chrome process) across many Agent sessions. Each new Agent will use an Incognito window and an isolated Man-in-the-middle proxy server.

```js
const { Agent, Pool } = require('@ulixee/unblocked-agent');

(async () => {
  const pool = new Pool();
  const agent = pool.createAgent();
  const page = await agent.newPage();
  await page.goto('https://example.org/');
  // ... extract
  await pool.close();
})();
```

### Browser

A Browser launches a Chrome process and uses inner-process communications to manage Devtools Protocol messages sent back and forth. In Unblocked Agent, a Browser might be launched once, and reused by many different Agents. Browsers are passed in a "BrowserEngine" object containing a path to the executable along with any launchArguments that should be sent to the process. Browsers may be launched directly for advanced use cases.

### BrowserContext

A Browser Context is the equivalent of an Incognito Window in Chrome. Each Browser Context is paired with a Man-in-the-Middle server that can be hooked into to adjust HTTP Headers, HTTP2 Settings, TLS ClientHello messages and more. 

### Page

Pages are the individual Web-pages (or Tabs) that open in Chrome. Pages can load one top-level URL at a time, which will render the full HTML into the page and load any Fonts, Images, Workers, Frames, etc that make up the contents of the page.

### Frame

Every Page gets a single main Frame that will endure across navigations. This main Frame will render the contents of the URL that has been loaded (ie, `goto`). During each navigation, additional Frames can be loaded into the page. These "child" Frames might or might not render any HTML content - many Ad networks use hidden Frames.

### Worker

The modern Web has a concept of Workers - Web, Shared and Service workers are all available to a webpage.

### Injected Scripts

Chrome Devtools Protocol allows a developer to register "scripts" which should run anytime a new frame is loaded or a webpage navigates. Unblocked Agent has a few default scripts that are set to load to provide functionality "inside" web Frames and Pages.  

### Isolated Worlds

The Devtools Protocol allows developers to create "isolated" javascript contexts to run code. These isolated environments have access to the same underlying HTML Document, but cannot be seen doing so by any other javascript environments. This allows Unblocked Agent querySelectors to run undetected. However, [Unblocked Plugins][plugins] often have a need to hook into the "default" javascript environment to hide markers that indicate to a headless Chrome session might be in use.

### Man-in-the-Middle (Mitm)

Unblocked Agent comes out of the box with a Man-in-the-Middle proxy server. This proxy server is necessary to give FULL control to a developer to modify HTTP headers across all javascript environments, including Workers. Unfortunately, opening the door to HTTP headers also means TLS ClientHello messages must be masked, as well as HTTP2 Settings and more. The Mitm server takes care of much of this "routing" out of the box, and exposes "Hooks" per the Unblocked [Specification][spec] to allow developers to modify Network requests.

### Mitm-Socket

The Mitm-Socket module provides a low-level Golang-based Socket Connect library that can use the ClientHello signatures of different Chrome, Safari and Firefox browsers.


## Contributing

We'd love your help in making Unblocked Agent a better tool. Please don't hesitate to send a pull request.

## License

[MIT](LICENSE.md)

[agent]: .
[double-agent]: ../double-agent
[plugins]: ../plugins
[human]: ../plugins/default-human-emulator
[spec]: ../specification
[jspath]: ../js-path
