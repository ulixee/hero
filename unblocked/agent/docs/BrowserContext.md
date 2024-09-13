# BrowserContext

A BrowserContext is a Chrome Window. It can be Incognito, as is the default state in Unblocked Agent. An Incognito window can have a dedicated Man-in-the-Middle proxy server, which makes it easier (and faster) to associate HTTP Requests from the given Pages.

## Constructor

Browser Contexts need to be created from a [Browser](./Browser.md) instance.

## Properties

- id `string` A Devtools assigned TargetId.
- logger `IBoundLog` The logger for this BrowserContext.
- browser `Browser` The creating [Browser](./Browser.md).
- browserId `string` Shortcut to the id of the [Browser](./Browser.md).
- isIncognito `boolean` Is the BrowserContext launched as an Incognito Session.
- lastOpenedPage `Page` The last page to have been opened by this BrowserContext.
- resources `Resources` An object that correlates Resources between what the Browser emits and what the Man-in-the-Middle emits.
- websocketMessages `WebsocketMessages` A WebsocketMessage tracker for this BrowserContext.
- workersById `Map<string, Worker>` All created [Workers](./Worker.md) by their assigned Devtools TargetId.
- pagesById `Map<string, Page>` All created [Pages](./Page.md) by their assigned Devtools TargetId.
- pagesByTabId `Map<number, Page>` All created [Pages](./Page.md) by an incremented Id unique to this BrowserContext.
- devtoolsSessionsById `Map<string, DevtoolsSession>` Tracks all [DevtoolsSessions](./DevtoolsSession.md) created as part of this BrowserContext (eg, for Pages, Workers, etc).
- devtoolsSessionLogger `DevtoolsSessionLogger` A logger that tracks DevtoolsSession events and methods and outputs them.
- proxy `IProxyConnectionOptions` The proxy configuration for this context. If it has an address-only, it is expected to be an isolated [Mitm](./Man-in-the-Middle.md).
- domStorage `IDomStorage` Preloaded DomStorage object to track storage changes into.
- hooks `IBrowserContextHooks & IInteractHooks` Optional hook callbacks.

## Methods

### open(): Promise<void>

Open this BrowserContext window.

### newPage(options): Promise<Page>

Create a new [Page](./Page.md) in this context.

#### Arguments

- options `IPageCreateOptions` Optional configuration
  - groupName `string` Optional label for the type of page. Can be useful for later figuring out what type of page was created (if supporting different options).
  - runPageScripts `boolean` Optional flag to disable running the initialization page hooks. Defaults to `false`.
  - enableDomStorageTracker `boolean` Optional flag to enable tracking IndexedDB and Local/Session storage events (via page.domStorageTracker).
  - triggerPopupOnPageId `string` A page to trigger popups on (if not the opener - eg, alt+click).
  - installJsPathIntoDefaultContext `boolean` Should the JsPath library be installed into the same Javascript Environment that a webpage script uses (as opposed to the "isolated context" invisible to a webpage script)

## Hooks

- onNewPage(page: [Page](./Page.md)): Promise<void> - Called before a new Page environment is allowed to load.
- onNewFrameProcess(frame: [Frame](./Frame.md)): Promise<void> - Called when a Frame is created in it's own process (oopif).
- onNewWorker(worker: [Worker](./Worker.md)): Promise<void> - Called before a new Worker environment is allowed to run.
- onDevtoolsPanelAttached(devtoolsSession: [DevtoolsSession](./DevtoolsSession.md)): Promise<any> - Called when a Devtools Panel attaches to this Browser.
- onDevtoolsPanelDetached(devtoolsSession: [DevtoolsSession](./DevtoolsSession.md)): Promise<any> - Called when a Devtools Panel closes.

## Events

- `page` Emitted when a new page is created.
- `worker` Emitted when a worker is created by a Page.
- `close` Emitted when the BrowserContext closes.
- `all-pages-closed` Emitted when all Pages are closed in a BrowserContext
