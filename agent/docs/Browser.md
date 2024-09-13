# Browser

A Browser object launches an underying "Chrome" process and manages inner-process communications. It provides a [DevtoolsSession](./DevtoolsSession.md) to initiate communications.

## Constructor

## Properties

### devtoosSession `DevtoosSession`

The [DevtoolsSession](./DevtoolsSession.md) object connected to the Browser level.

### id `string`

An incremented counter.

### engine `IBrowserEngine`

The underlying [BrowserEngine](./BrowserEngine.md)

### browserContextsById `Map<string, BrowserContext>`

Map of all BrowserContexts by their ids. A "default" context will have an id of `undefined` (if created).

## Methods

### close(): Promise<void>

Shut down the Browser process and close all BrowserContexts.

### launch(): Promise<Browser>

Launch the Browser Engine. Checks that the BrowserEngine has installed pre-requisites (Linux only).

### newContext(options): Promise<BrowserContext>

Creates a new BrowserContext.

#### Arguments

- options
  - logger `IBoundLog` A logger instance
  - proxy `IProxyConnectionOptions` Optional proxy connection information for this BrowserContext. NOTE: only applies to incognito BrowserContexts.
  - hooks `IBrowserContextHooks & IInteractHooks` Optional hook callbacks.
  - isIncognito `boolean` Whether to launch an incognito window. Defaults to `true`.
  - commandMarker `ICommandMarker` Optional object to keep track of command checkpoints.

### getContext(id): BrowserContext

Gets a BrowserContext by id. If no id is provided, returns the default Browser Context (eg, non-incognito)

## Hooks

- onNewBrowser(browser: [Browser](./Browser.md)): Promise<void> - Called before a new Browser is launched.
- onNewBrowserContext(context: [BrowserContext](./BrowserContext.md)): Promise<any> - Called when a new BrowserContext is opened.
- onDevtoolsPanelAttached(devtoolsSession: [DevtoolsSession](./DevtoolsSession.md)): Promise<any> - Called when a Devtools Panel attaches to this Browser.
