# JsPath

JsPath is a serializable specification for referencing a path to a DOM node, property or method.

This library was created as a way to create paths to methods and properties of the DOM remotely. Breaking a path into individual steps allows a library to create references to nested objects (eg, passing a Node into a function) without AST parsing a string of code. It also provides a mechanism for creating "references" to nodes (NodePointer.id), dynamically inspecting properties (appending internal state methods), and more without requiring any parsing.

For a fully-typed implementation of accessing a remote DOM, refer to the [AwaitedDOM](https://docs.ulixee.org/docs/hero/basic-interfaces/awaited-dom).

### IJsPath

IJsPath is an array of "steps" to locate (or re-locate) a node. Steps can be the following:

- An [INodePointer](#inodepointer) id `number`. eg: `[1]`.
- A Function `Array`. `[MethodName, ...arguments]`, eg: `['document', ['querySelector','p']]`.
- A Property name `string`. eg: `[1, 'innerText']` will get the innerText of node with NodePointer id = 1.

### INodePointer

INodePointer is a persisted reference to a DOM Node. It includes extra details about a node. An iterable Node type will serialize the properties as well.

NOTE: A DOM Node could also be a querySelector, and can be used to re-retrieve instance properties.

- id: `number`. The Id that can be used in future references to this DOM Node.
- type: `string`. The type of DOM Node. eg, `HTMLDivElement`.
- preview?: `string`. A string preview of the HTML Element or DOM Node.
- iterableIsNodePointers?: `boolean`. If iterableItems are provided, returns `true` if the items are `INodePointers`.
- iterableItems?: `(string | number | boolean | object | INodePointer)[]`. The serialized iterable properties if this result set is iterable. eg, HTMLCollection, NodeList, Attributes, etc.

### INodeVisibility

INodeVisibility interface represents the various attributes of visibility a DOM Node possesses. It can be used to determine if a Node can be interacted with on a Webpage.

NOTE: It is up to an implementation library to create the mechanism for requesting the visibility of a node.

The returned properties will be calculated and returned as follows:

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

## Installation

```shell script
npm i --save @unblocked-web/js-path
```

or

```shell script
yarn add @unblocked-web/js-path
```

## Contributing

Contributions are welcome.

## License

[MIT](LICENSE)
