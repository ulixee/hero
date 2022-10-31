# Frame

A Frame is a Javascript "sandbox" that can load one or more HTML Documents. Frames can have nested IFrame or Frame tags that cause it to be the part of other Frames. Every [Page](./Page.md) has a mainFrame. The mainFrame is what you usually think of when you navigate a Browser to a URL. The Frame should be considered a "low-level" API, but you will occasionally need to access APIs on this class if they aren't exposed on the Page object, or you are interacting with a child Frame.

### Core Concepts

- `Attached`/`Detached`. Frames are considered "attached" when they are added to a Document tree. If the DOM element is removed, it is detached. This will also occur if the parent Frame navigates.
- `Parent`/`Child Frames`. Frames live in a hierarchy. There's a top-level Frame called a MainFrame. Other Frames have a Parent, which is another Frame in the DOM Tree.
- `Security context` Inside a WebPage, Frames are Sandboxed from other Frames that don't live inside the same Security context. A Security context is the origin of the hosting webpage.
- `Cross-Domain`. Because of the Security Context of each Frame, one Frame cannot access content on a Frame from a different Security Context. An Unblocked Agent can access ALL Frames, but you should directly run an `evaluate` on the Frame you're trying to access.
- `Navigation Loader` Anytime a Frame navigates, a "NavigationLoader" is created. This Loader (and LoaderId) will be tracked from the Frame navigation request, to the HTTP request and response and the eventual DOM Lifecycle (DOMContentLoaded, load, FirstContentfulPaint, etc).
- `Lifecycle`. As a Frame is loaded, it will emit "events" indicating the progress of loading the content from a given URL. We combine these events with a Navigation Loader to determine when a `FrameNavigation` is reached the LoadStatus we're looking for (eg, `waitForLoad`).
- `Isolated Execution Context`. Devtools Protocol allows programs to run code in a sandboxed Execution environment. This means it cannot be detected by code running the main webpage javascript. By default, Unblocked Agent installs a [JSPath](./JsPath.md) into an isolated execution context.

## Constructor

You should not create Frames. They're built by the `FramesManager` class as it detects Frames added to a Page. The FramesManager will track the lifecycle of each Frame.

## Properties

- id `string` An ID assigned by the Devtools Protocol.
- frameId `number` An incremented ID unique to a BrowserContext.
- parentId `string` A Parent ID if this is a nested Frame. If not set, this is the MainFrame.
- name `string` A name of the frame given by the DOM.
- url `string` The current url of the Frame.
- isDefaultUrl `boolean` If the current Frame URL is 'about:blank' or another default URL.
- activeLoader `NavigationLoader` Gets the current NavigationLoader of the Frame.
- navigationReason `string` A reason the Frame navigated. This is a Devtools Protocol value (eg, 'formSubmissionGet','anchorClick')
- disposition `string` Where the navigation occurred (currentTab, newTab, etc)
- securityOrigin `string` The origin of the frame distilled into a Security context.
- isAttached `boolean` Is the containing Frame DOM Element connected to the DOM tree.
- jsPath [`JsPath`](./JsPath.md) An object with JsPath utility functions on it.
- navigations `FrameNavigations` An object tracking the history of navigations performed by a Frame, along with the lifecycle events.
- navigationsObserver `FrameNavigationsObserver` An object used to create "trigger" events when specific Load or Location statuses are desired.
- navigationLoadersById `{ [loaderId:string]: NavigationLoader }` Tracks all NavigationLoaders (the object that tracks the Browser-level loading of a navigation resource) by the given ID. In-Page navigations are given auto-generated LoaderIds that start with `inpage-`.
- page [`Page`](./Page.md) The containing Page object.

## Methods

### frame.close(): Promise<void>

### evaluate<T>(script, isolateFromWebpage, options): Promise<T>

Evaluate a Javascript expression/script on this Frame.

#### **Arguments**:

- script `string`. A Javascript expression to evaluate. It should call itself if this is a function. Multiple lines need to be wrapped in a containing script.
- isolateFromWebpage `boolean`. Whether to isolate this expression from the webpage memory space. Default `false`.
- options
  - shouldAwaitExpression `boolean` Should wait for a promise result
  - retriesWaitingForLoad `number` Should retry if the ExecutionContext hasn't been loaded
  - returnByValue `boolean` Should return the result by value (or attempt to serialize using Chrome object references).
  - includeCommandLineAPI `boolean` Should Devtools Console apis be available?

### frame.waitForLifecycleEvent(event, loaderId?, timeoutMs?): Promise<void>

Low-level Devtools Protocol level method to wait for a raw Lifecycle event to occur. This function will first wait for a NavigationLoader to have committed before waiting for a Lifecycle event

#### **Arguments**:

- event `string` A Lifecycle event to look for (using raw Devtools Event names). Defaults to `load`.
- loaderId? `string`. Optional loaderId to specifically wait for. Defaults to the `activeLoaderId`.
- timeoutMs `number`. Timeout in milliseconds. Default `30,000`.

### frame.waitForLoad(options): Promise<INavigation>

Wait for the load status of this Frame to complete (if not already completed).

#### **Arguments**:

- options `object`
  - loadStatus `LoadStatus` The load status event to wait for. Default `JavascriptReady`
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for status changed.

#### **Returns** `Promise<INavigation>` The navigation that fulfilled this request.

The following are possible `LoadStatuses` and their meanings:

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

### frame.waitForLocation(trigger, options)

Waits for a navigational change to document.location either because of a `reload` event or changes to the URL.

#### **Arguments**:

- trigger `change | reload` The same url has been reloaded, or it's a new url.
- options `object`
  - timeoutMs `number`. Timeout in milliseconds. Default `30,000`.
  - sinceCommandId `number`. A `commandId` from which to look for changes.

#### **Returns**: Promise<IResourceMeta> The resource representing this location change or reload.

Location changes are triggered in one of two ways:

| Trigger  | Description                                                    |
| -------- | -------------------------------------------------------------- |
| `change` | A navigational change to document.location has been triggered. |
| `reload` | A reload of the current document.location has been triggered.  |

The following example waits for a new page to load after clicking on an anchor tag:

```js
await page.goto('http://example.com');

await page.click('a');
await page.mainFrame.waitForLocation('change');
```

### interact(...interactionGroups): Promise<void>

Initiate an interaction with one or more elements using the [JSPath](https://github.com/unblocked-web/js-path) specification.

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

### frame.waitForScrollStop(timeoutMs: number): Promise<void>

Wait for a Mouse wheel event to be fulfilled. This command doesn't return a completion event otherwise.

### frame.getWindowOffset(): Promise<IWindowOffset>

Get the current Frame size, content size and scroll position

### frame.getNodePointerId(devtoolsObjectId: string): Promise<number>

Lookup the JsPath NodePointerId for a Devtools Element ObjectId.

### frame.getFrameElementNodePointerId(): Promise<number>

Get the JsPath NodePointerId for this Frame's containing DOM Element (null if this is the mainFrame).

### frame.getContainerOffset(): Promise<IPoint>

This function will lookup the X,Y point of each Containing Frame of a Frame's parent Frames and sum the offsets. Ie, an absolute position in the Viewport for a given Frame.

### frame.outerHTML(): Promise<string>

Returns the HTML of the Frame document.

### frame.setFileInputFiles(nodePointerId: number, files: string[]): Promise<void>

This function works after a `filechooser` event is triggered and has looked up the underlying NodePointer id.

#### **Arguments**:

- nodePointerId `number`. JsPath NodePointerId of the given File input element.
- files `string[]`. A set of file paths to set to the File input files.

### frame.evaluateOnNode<T>(devtoolsNodeId, expression): Promise<T>

Run a function on a given Devtools Node. This is a low-level API.

Returns a value cast to the given type T.

#### **Arguments**:

- devtoolsNodeId `string`. The Devtools Protocol "ObjectId" for a node.
- expression `string`. An expression that will be evaluated inside a "function" called with fn.call(element). Ie, this === element.

### frame.getFrameElementDevtoolsNodeId(): Promise<string>

Gets the Devtools "NodeId" for the Frame Element.

### frame.waitForNavigationLoader(loaderId, timeoutMs): Promise<void>

Wait for a Navigation Loader to complete.

#### **Arguments**:

- loaderId `string`. The loaderId to wait for
- timeoutMs `number`. Milliseconds to wait for timeout.

### frame.waitForDefaultLoader(): Promise<void>

Waits until the default loader has activated.

### frame.getActiveContextId(): Promise<number>

Gets the default Execution Context Id (to use in low-level `Runtime.evaluate` calls).

### frame.waitForActiveContextId(isolatedFromWebPage): Promise<number>

Wait until an Execution Context Id has been created. If `isolatedFromWebPage` is true, waits until the `__agent_world__` isolated execution context is created for the current Frame.

#### **Arguments**:

- isolatedFromWebPage `boolean`. Should wait for the isolated context to be available.

## Hooks

- playInteractions `(interactions, runFn, helper)` - called before [`interact`](#interactinteractiongroups-promisevoid)

## Events

- frame-lifecycle `{ frame: Frame; name: string; loader: INavigationLoader; timestamp: number; }`. Frame Lifecycle changed.
- frame-navigated `{ frame: Frame; navigatedInDocument?: boolean; loaderId: string; }` Frame navigated to a new URL.
- frame-requested-navigation `{ frame: Frame; url: string; reason: NavigationReason; }` Frame requested a navigation. Might or might not complete.
- frame-loader-created `{ frame: Frame; loaderId: string; }` A new NavigationLoader has been initiated for this Frame.
