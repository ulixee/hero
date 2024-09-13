# Page

A Page is an individual "WebPage" that is opened in a [BrowserContext](./BrowserContext.md). It can navigate to pages and provides programmatic ways to interact with the DOM.

Pages install a [JsPath](https://github.com/ulixee/unblocked/tree/main/js-path) implementation into every [Frame](./Frame.md).

## Constructor

Pages must be created from a [BrowserContext](./BrowserContext.md#newpageoptions-promisepage) or through user interactions that spawn new pages.

## Properties

- id `string` A Devtools TargetId for the Page.
- pageId `number` Assigned, auto-incrementing ID for the Page.
- devtoolsSession [DevtoolsSession](./DevtoolsSession.md) A DevtoolsSession bound to this Page.
- mainFrame [Frame](./Frame.md) The main Frame of the page. This Frame and Id will remain consistent for a given Page.
- frames [Frame[]](./Frame.md) List of active Frames (eg, still attached to the DOM).
- keyboard `Keyboard` Object to interact with the virtual Keyboard provided by Chrome Devtools Protocol.
- mouse `Mouse` Object to interact with the virtual Mouse provided by Chrome Devtools Protocol.
- workersById `Map<string, Worker>` Map of [Workers](./Worker.md) created by this Page by their TargetIds.
- browserContext [`BrowserContext`](./BrowserContext.md) The BrowserContext (window) this Page is part of.
- opener `Page` Set to an opening Page instance if this page was opened by another Page.
- networkManager `NetworkManager` Internal object that tracks and emits Browser-level Network requests and applies appropriate Proxy settings.
- framesManager `FramesManager` Internal object used to track the [Frames](./Frame.md) created by the Page.
- domStorageTracker `DomStorageTracker` Tracks LocalStorage, SessionStorage and IndexedDB changes.
- groupName `string` An optional tracking label for a page
- runPageScripts `boolean` Flag if this Page ran the default hooks and initialization scripts.
- popupInitializeFn `(page: Page, openParams: { url: string; windowName: string }) => Promise<any>` A function called when a Popup window is created.
- isClosed `boolean` Is this Page closed.
- isReady `Promise<void>` Has this Page run all initialization scripts.
- windowOpenParams `Devtools Page.WindowOpenEvent` Window opener parameters if this Page was spawned by another (either in javascript of via a click of an anchor with a new target)
- installJsPathIntoIsolatedContext `boolean` Should the JsPath library be installed into the same Javascript Environment that a webpage script uses (as opposed to the "isolated context" invisible to a webpage script)
- activeDialog `IDialog` If an active Dialog is opened, it is set into this variable. NOTE: in-page javascript will not work while this is active.
- lastActivityId `number` Shortcut to the last marker provided by the `ICommandMarker` passed into this Page. This functionality is mostly used to determine a starting point for a `waitForLocation` call.
- logger `IBoundLog` Logger instance.

## Methods

### page.close(): Promise<void>

Closes the current page

### setNetworkRequestInterceptor(interceptor): Promise<void>

Set a method to Intercept HTTP requests and responses at a Browser level. These requests will not make it to the Man-in-the-Middle.

Interceptors can be used to serve fake bodies, or cancel HTTP requests from occurring.

#### **Arguments**:

- interceptor `networkRequestsFn: (request: Protocol.Fetch.RequestPausedEvent) => Promise<Protocol.Fetch.FulfillRequestRequest | Protocol.Fetch.ContinueRequestRequest>`. A Devtools Protocol level Fetch interceptor. If null is returned, the request will send a `Fetch.ContinueRequest`.

### interact(...interactionGroups): Promise<void>

Initiate an interaction with one or more elements using the [JSPath](https://github.com/ulixee/unblocked/tree/main/js-path) specification.

```js
await page.interact([
  {
    command: InteractionCommand.click,
    mousePosition: ['document', ['querySelector', 'button']],
  },
]);
```

#### **Arguments**:

- interactionGroups [IInteractionGroups](./Interactions.md)

### click(jsPathOrSelector, verification): Promise<void>

Shortcut to initiate a click on a selector a jsPath. This is a convenience method.

```js
await page.click('button');
await page.click(['document', ['querySelector', 'a']]);
```

#### **Arguments**:

- jsPathOrSelector `string` | `JSPath`. If this is a string, it will be converted to a `document.querySelector` JSPath. Otherwise, tries to click on the JSPath provided.
- verification `IElementVerification`. Try to add verification that an element is clicked on. NOTE: this must be implemented by an Interaction plugin.

### type(text): Promise<void>

Shortcut to type a string of text.

#### **Arguments**:

- text `string`. Text characters to type.

### addNewDocumentScript(script, isolateFromWebpage): Promise<{ identifier:string }>

Add a new script to run on all new Frames created from this Page, as well as before any new Navigations are completed on the main [Frame](./Frame.md). Returns an identifier that can be uninstalled by passing to `page.removeDocumentScript`.

#### **Arguments**:

- script `string`. The script to run
- isolateFromWebpage `boolean`. Should this script run in the same Javascript memory as the main webpage, or should it be isolated. NOTE: to manipulate the default DOM objects and methods, you must set this flag to `false`. Defaults to `true`.

### removeDocumentScript(scriptId): Promise<void>

Uninstall a newDocumentScript. NOTE: this will not un-do anything ran on the current Page + Frames.

#### **Arguments**:

### addPageCallback(name, onCallbackFn, isolateFromWebpage): Promise<RegisteredEventListener>

Add a "function" that can be called from in-Page javascript back to Node.js. The function "name" will be available on the global `window` or `self` of each Frame.

#### **Arguments**:

- name `string`. The name of the callbackFn variable.
- onCallbackFn `(payload: string, frameId: string) => void` A callback to trigger when this Page Binding is triggered.
- isolateFromWebpage `boolean`. Should this binding be visible in the same memory as the webpage memory? If `false`, ensure you remove this variable during a newDocumentScript so it can't be seen.

### setJavaScriptEnabled(enabled): Promise<void>

Disable (or re-enable) Page scripts/javascript. This still allows the Isolated environment to operate.

#### **Arguments**:

- enabled `boolean` Whether to enable or disable

### evaluate<T>(script, isolateFromWebpage): Promise<T>

Evaluate a Javascript expression/script on the main [Frame](./Frame.md) of this Page.

#### **Arguments**:

- script `string`. A Javascript expression to evaluate. Multiple lines need to be wrapped in a containing, self-calling function.
- isolateFromWebpage `boolean`. Whether to isolate this expression from the webpage memory space. Default `false`.

### navigate(url, options): Promise<{loaderId: string}>

Navigates the main [Frame](./Frame.md) to a url. Returns the "LoaderId" of the navigation, which is Chrome's name for the process of Looking up a URL, performing an HTTP request + response and loading it into a Frame.

#### **Arguments**:

- url `string`. The url to load.
- options
  - referer `string`. Optional referer to list in the initial HTTP request.

### page.goto(url, options): Promise<IResourceMeta>

Runs `navigate`, waits for the `NavigationLoader` to load, and then waits for the `Resource` to be loaded by the Man-in-the-Middle.

#### **Arguments**:

- url `string` The location to navigate to.
- options
  - timeoutMs `number`. Optional timeout milliseconds. Default `30,000`. A value of `0` will never timeout.
  - referrer `string`. Optional referrer to set on http requests.

#### **Returns**: `Promise<IResourceMeta>` The loaded resource representing this page.

### page.waitForLoad(status, options)

Wait for the load status of the main [Frame](./Frame.md) to complete.

#### **Arguments**:

- status `NavigationRequested | HttpRequested | HttpResponsed | HttpRedirected | DomContentLoaded | PaintingStable` The load status event to wait for.
- options `object`
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for status changed.

#### **Returns** `Promise<void>`

The following are possible statuses and their meanings:

| Status                | Description                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `NavigationRequested` | A navigation request is initiated by the page or user                                    |
| `HttpRequested`       | The http request for the document has been initiated                                     |
| `HttpResponded`       | The http response has been retrieved                                                     |
| `HttpRedirected`      | The original http request was redirected                                                 |
| `JavascriptReady`     | The page has been loaded.                                                                |
| `DomContentLoaded`    | The dom content has been received and loaded into the document                           |
| `AllContentLoaded`    | The page load event has triggered. NOTE: this does not ALWAYS trigger in browser.        |
| `PaintingStable`      | The page has loaded the main content above the fold. Works on javascript-rendered pages. |

### page.execJsPath<T>(jsPath): Promise<IExecJsPathResult<T>>

#### Arguments:

### page.goBack(options): Promise<string>

Navigates to a previous url in the navigation history.

#### **Arguments**:

- options `object`. Optional arguments
  - timeoutMs `number`. Optional timeout milliseconds. Default `30,000`. A value of `0` will never timeout.
  - waitForLoadStatus `LoadStatus`. Optional status to wait for. Defaults to `PaintingStable`.

#### **Returns** `Promise<string>` The new document url.

### page.goForward(options): Promise<string>

Navigates forward in the navigation history stack.

#### **Arguments**:

- options `object`. Optional arguments
  - timeoutMs `number`. Optional timeout milliseconds. Default `30,000`. A value of `0` will never timeout.
  - waitForLoadStatus `LoadStatus`. Optional status to wait for. Defaults to `PaintingStable`.

#### **Returns** `Promise<string>` The new document url.

### page.reload(options): Promise<IResourceMeta>

Reload the currently loaded url.

#### **Arguments**:

- options
  - timeoutMs `number`. Optional timeout milliseconds. Default `30,000`. A value of `0` will never timeout.

#### **Returns**: `Promise<IResourceMeta>` The loaded resource representing this page.

### page.bringToFront(): Promise<void>

Make this page the `activePage` within a browser.

### page.dismissDialog(accept, promptText): Promise<void>

Dismiss an active dialog and optionally fill in prompt text.

#### **Arguments**:

- accept `boolean`. Accept or reject dialog
- promptText `string` Optional text to fill in

### page.screenshot(options): Promise<Buffer>

Takes a screenshot of the current contents rendered in the browser.

#### **Arguments**:

- options `object` Optional
  - format `jpeg | png`. Image format type to create. Default `jpeg`.
  - jpegQuality `number`. Optional compression quality from 1 to 100 for jpeg images (100 is highest quality).
  - rectangle `IRect`. Optionally clip the screenshot to the given rectangle (eg, x, y, width, height). Includes a pixel scale.
  - fullPage `boolean`. Should the screenshot resize the Page to capture the full length and width of the contents.

#### **Returns** `Promise<Buffer>` Buffer with image bytes in base64.

### page.close(): Promise<void>

Sends a close event to the page to trigger unload events before destroying the target.

#### **Arguments**:

- options `object` Optional
  - timeoutMs `number` Duration in milliseconds to wait for the close to complete.

## Hooks

- onNewPage([page](./Page.md)) - called before debugger is resumed on a new page instance.
- onNewWorker([worker](./Worker.md)) - called before debugger is resumed for workers on this page.

## Events

- close `void` - Page closed
- console `{ frameId: string; type: string; message: string; location: string }` - Console message logged
- crashed `{ error: Error; fatal?: boolean }` - Page crashed
- dialog-closed `{ wasConfirmed: boolean; userInput: string; }` - A dialog closed
- dialog-opening `{ dialog: IDialog }` - A dialog is opening - it must be dealt with to un-freeze the page.
- dom-storage-updated `{ type: localStorage | sessionStorage | indexedDB; securityOrigin: string; action: add | update | remove; timestamp: number; key: string; value?: string; meta?: any; };` - A LocalStorage, SessionStorage or IndexedDB record was triggered on the page.
- filechooser `{ prompt: IFileChooserPrompt }` - A filechooser prompt has initiated.
- frame-created `{ frame: IFrame; loaderId: string }` - A child [Frame](./Frame.md) has been created
- navigation-response `{ browserRequestId: string; frameId: string; status: number; location?: string; url?: string; loaderId: string; timestamp: number; }` - A Navigation request received a response (main or child frame).
- page-error `{ frameId: string; error: Error }` - An error occurred in the Page javascript.
- page-callback-triggered `{ name: string; frameId: string; payload: string }` - A "binding" was triggered on the page.
- resource-will-be-requested:`{ resource: IBrowserResourceRequest; redirectedFromUrl: string; isDocumentNavigation: boolean; frameId: string; loaderId?: string; }` - Called when the Page is about to initiate an HTTP request.
- resource-was-requested `{ resource: IBrowserResourceRequest; redirectedFromUrl: string; isDocumentNavigation: boolean; frameId: string; loaderId?: string; }` - Called after a Page has initiated an HTTP request.
- resource-loaded `{ resource: IBrowserResourceRequest; frameId?: string; loaderId?: string; body(): Promise<Buffer | null>; };` - Called when a Page loads an HTTP resource.
- resource-failed `{ resource: IBrowserResourceRequest; };` - Called when a Resource fails to load (or is Aborted).
- screenshot `{ imageBase64: string; timestamp: number }` - Called when a Screenshot is taken.
- websocket-frame `{ browserRequestId: string; message: string | Buffer; isFromServer: boolean; timestamp: number; }` - Call when a Websocket message is sent or received by the Page.
- websocket-handshake `{ browserRequestId: string; headers: { [key: string]: string }; }` - Called during the initial handshake for a Websocket connection.
- worker `{ worker: IWorker }` - Called when a new [Worker](./Worker.md) is created.
