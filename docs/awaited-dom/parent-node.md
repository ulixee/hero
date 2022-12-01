# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> ParentNode

<div class='overview'><span class="seoSummary">The <code><strong>ParentNode</strong></code> mixin contains methods and properties that are common to all types of <code>Node</code> objects that can have children.</span> It's implemented by <code>Element</code>, <code>Document</code>, and <code>DocumentFragment</code> objects.</div>

<div class='overview'>See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors" target="mdnrel">Locating DOM elements using selectors</a> to learn how to use CSS selectors to find nodes or elements of interest.</div>

## Properties

### .childElementCount <div class="specs"><i>W3C</i></div> {#childElementCount}

Returns the number of children of this <code>ParentNode</code> which are elements.

#### **Type**: `Promise<number>`

### .children <div class="specs"><i>W3C</i></div> {#children}

Returns a live <code>HTMLCollection</code> containing all of the <code>Element</code> objects that are children of this <code>ParentNode</code>, omitting all of its non-element nodes.

#### **Type**: [`SuperHTMLCollection`](./super-html-collection.md)

### .firstElementChild <div class="specs"><i>W3C</i></div> {#firstElementChild}

Returns the first node which is both a child of this <code>ParentNode</code> <em>and</em> is also an <code>Element</code>, or <code>null</code> if there is none.

#### **Type**: [`SuperElement`](./super-element.md)

### .lastElementChild <div class="specs"><i>W3C</i></div> {#lastElementChild}

Returns the last node which is both a child of this <code>ParentNode</code> <em>and</em> is an <code>Element</code>, or <code>null</code> if there is none.

#### **Type**: [`SuperElement`](./super-element.md)

## Methods

### .querySelector *(selectors)* <div class="specs"><i>W3C</i></div> {#querySelector}

Returns the first <code>Element</code> with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - selectors `string`. A `string` containing one or more selectors to match against. This string must be a valid compound selector list supported by the browser; if it's not, a <code>SyntaxError</code> exception is thrown. See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors" target="mdnrel">Locating DOM elements using selectors</a> for more information about using selectors to identify elements. Multiple selectors may be specified by separating them using commas.

#### **Returns**: [`SuperElement`](./super-element.md)

### .querySelectorAll *(selectors)* <div class="specs"><i>W3C</i></div> {#querySelectorAll}

Returns a <code>NodeList</code> representing a list of elements with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - selectors `string`. A `string` containing one or more selectors to match against. This string must be a valid CSS selector string; if it's not, a <code>SyntaxError</code> exception is thrown. See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors" target="mdnrel">Locating DOM elements using selectors</a> for more information about using selectors to identify elements. Multiple selectors may be specified by separating them using commas.

#### **Returns**: [`SuperNodeList`](./super-node-list.md)

## Unimplemented Specs

#### Methods

|     |     |
| --- | --- |
| `append()` | `prepend()` |
