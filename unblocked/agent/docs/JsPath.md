# JsPath

JsPath makes various functions available implementing the [JsPath](https://github.com/ulixee/unblocked/tree/main/js-path) specification.

Concepts:

- `JsPath` A serialization format to address DOM Nodes, properties and method calls.
- `NodePointer` A pointer to a DOM node so it can be referenced across many JsPath queries.
- `NodeVisiblity` A lookup for all of the parts that make a DOM Element clickable and visible on a page.

They can be accessed from the `@ulixee/unblocked-specification/browser/IJsPathFunctions.ts` file.

## Methods

### getLastClientRect(nodeId: number): IElementRect

Get the last known position for a NodePointerId.

### getClientRect(jsPath: IJsPath, includeNodeVisibility: boolean): Promise<IExecJsPathResult<IElementRect>>

Looks up an `IElementRect` for a JsPath. Optionally includes looking up a NodeVisibility.

### exec<T>(jsPath: IJsPath): Promise<IExecJsPathResult<T>>;

Run a JS Path request.

#### Specialized Function calls

The following functions are built-ins that can be specially looked up by appending them to the end of JsPaths.

```
const getNodePointerFnName = "__getNodePointer__";
const getClientRectFnName = "__getClientRect__";
const getComputedVisibilityFnName = "__getComputedVisibility__";
const getComputedStyleFnName = "__getComputedStyle__";
const isFocusedFnName = "__isFocused__";
const getNodeIdFnName = "__getNodeId__";
```

### getNodePointer<T>(jsPath: IJsPath, containerOffset?: IPoint): Promise<IExecJsPathResult<T>>;

Lookup a NodePointer for a JsPath.

### getNodePointerId(jsPath: IJsPath): Promise<number>;

Lookup just the NodePointerId of a JsPath

### getNodeVisibility(jsPath: IJsPath): Promise<INodeVisibility>;

Determines if the resulting Element from a JsPath is visible to an end user. This method checks whether a node (or containing element) has:

- layout: width, height, x and y.
- opacity: non-zero opacity.
- css visibility: the element does not have a computed style where visibility=hidden.
- no overlay: no other element which overlays more than one fourth of this element and has at least 1 pixel over the center of the element.
- on the visible screen (not beyond the horizontal or vertical viewport)

#### **Arguments**:

#### **Returns** `Promise<INodeVisibility>` Boolean values indicating if the node (or closest element) is visible to an end user.

- INodeVisibility `object`
  - isVisible `boolean`. The node is visible (`nodeExists`, `hasContainingElement`, `isConnected`, `hasCssOpacity`,`hasCssDisplay`,`hasCssVisibility` `hasDimensions`).
  - isClickable `boolean`. The node is visible, in the viewport and unobstructed (`isVisible`, `isOnscreenVertical`, `isOnscreenHorizontal` and `isUnobstructedByOtherElements`).
  - nodeExists `boolean`. Was the node found in the DOM.
  - isOnscreenVertical `boolean`. The node is on-screen vertically.
  - isOnscreenHorizontal `boolean`. The node is on-screen horizontally.
  - hasContainingElement `boolean`. The node is an Element or has a containing Element providing layout.
  - isConnected `boolean`. The node is connected to the DOM.
  - hasCssOpacity `boolean`. The display `opacity` property is not "0".
  - hasCssDisplay `boolean`. The display `display` property is not "none".
  - hasCssVisibility `boolean`. The visibility `style` property is not "hidden".
  - hasDimensions `boolean`. The node has width and height.
  - isUnobstructedByOtherElements `boolean`. The node is not hidden or obscured > 50% by another element.

### getSourceJsPath(nodePointer: INodePointer): IJsPath;

Find the source JsPath for a nodePointer. This can re-hydrate the source JsPaths that led to a given NodePointer.

### reloadJsPath<T>(jsPath: IJsPath, containerOffset: IPoint): Promise<IExecJsPathResult<T>>;

Re-checks an original full JsPath to determine of it evaluates to a new result. This can happen frequently on dynamic websites where the same element node is swapped out for updated content (think Vue or React apps).

### simulateOptionClick(jsPath: IJsPath): Promise<IExecJsPathResult<boolean>>;

Simulate clicking on an "Option" element. Options do not render in the Browser, so do not have a Viewport-based position. This means they have to have a simulated "interaction".
