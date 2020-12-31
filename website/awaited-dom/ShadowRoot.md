# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> ShadowRoot

<div class='overview'>The <code><strong>ShadowRoot</strong></code> interface of the Shadow DOM API is the root node of a DOM subtree that is rendered separately from a document's main DOM tree.</div>

<div class='overview'>You can retrieve a reference to an element's shadow root using its <code>Element.shadowRoot</code> property, provided it was created using <code>Element.attachShadow()</code> with the <code>mode</code> option set to <code>open</code>.</div>

## Properties

### .delegatesFocus <div class="specs"><i>W3C</i></div> {#delegatesFocus}

Returns a boolean that indicates whether delegatesFocus was set when the shadow was attached (see <code>Element.attachShadow()</code>).

#### **Type**: `Promise<boolean>`

### .host <div class="specs"><i>W3C</i></div> {#host}

Returns a reference to the DOM element the <code>ShadowRoot</code>&nbsp;is attached to.

#### **Type**: [`SuperElement`](./super-element)

### .innerHTML <div class="specs"><i>W3C</i></div> {#innerHTML}

Sets or returns a reference to the DOM tree inside the <code>ShadowRoot</code>.

#### **Type**: `Promise<string>`

### .mode <div class="specs"><i>W3C</i></div> {#mode}

The mode of the <code>ShadowRoot</code> — either <code>open</code> or <code>closed</code>. This defines whether or not the shadow root's internal features are accessible from JavaScript.

#### **Type**: `Promise<ShadowRootMode>`

### .baseURI <div class="specs"><i>W3C</i></div> {#baseURI}

Returns a `string` representing the base URL of the document containing the <code>Node</code>.

#### **Type**: `Promise<string>`

### .childNodes <div class="specs"><i>W3C</i></div> {#childNodes}

Returns a live <code>NodeList</code> containing all the children of this node. <code>NodeList</code> being live means that if the children of the <code>Node</code> change, the <code>NodeList</code> object is automatically updated.

#### **Type**: [`SuperNodeList`](./super-node-list)

### .firstChild <div class="specs"><i>W3C</i></div> {#firstChild}

Returns a <code>Node</code> representing the first direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: [`SuperNode`](./super-node)

### .isConnected <div class="specs"><i>W3C</i></div> {#isConnected}

A boolean indicating whether or not the Node is connected (directly or indirectly) to the context object, e.g. the <code>Document</code> object in the case of the normal DOM, or the <code>ShadowRoot</code> in the case of a shadow DOM.

#### **Type**: `Promise<boolean>`

### .lastChild <div class="specs"><i>W3C</i></div> {#lastChild}

Returns a <code>Node</code> representing the last direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: [`SuperNode`](./super-node)

### .nextSibling <div class="specs"><i>W3C</i></div> {#nextSibling}

Returns a <code>Node</code> representing the next node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: [`SuperNode`](./super-node)

### .nodeName <div class="specs"><i>W3C</i></div> {#nodeName}

Returns a `string` containing the name of the <code>Node</code>. The structure of the name will differ with the node type. E.g. An <code>HTMLElement</code> will contain the name of the corresponding tag, like <code>'audio'</code> for an <code>HTMLAudioElement</code>, a <code>Text</code> node will have the <code>'#text'</code> string, or a <code>Document</code> node will have the <code>'#document'</code> string.

#### **Type**: `Promise<string>`

### .nodeType <div class="specs"><i>W3C</i></div> {#nodeType}

Returns an <code>unsigned short</code> representing the type of the node. Possible values are:
	
<code class="language-html">
    <table class="standard-table">
		<thead>
			<tr>
				<th scope="col">Name</th>
				<th scope="col">Value</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><code>ELEMENT_NODE</code></td>
				<td><code>1</code></td>
			</tr>
			<tr>
				<td><code>ATTRIBUTE_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>2</code></td>
			</tr>
			<tr>
				<td><code>TEXT_NODE</code></td>
				<td><code>3</code></td>
			</tr>
			<tr>
				<td><code>CDATA_SECTION_NODE</code></td>
				<td><code>4</code></td>
			</tr>
			<tr>
				<td><code>ENTITY_REFERENCE_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>5</code></td>
			</tr>
			<tr>
				<td><code>ENTITY_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>6</code></td>
			</tr>
			<tr>
				<td><code>PROCESSING_INSTRUCTION_NODE</code></td>
				<td><code>7</code></td>
			</tr>
			<tr>
				<td><code>COMMENT_NODE</code></td>
				<td><code>8</code></td>
			</tr>
			<tr>
				<td><code>DOCUMENT_NODE</code></td>
				<td><code>9</code></td>
			</tr>
			<tr>
				<td><code>DOCUMENT_TYPE_NODE</code></td>
				<td><code>10</code></td>
			</tr>
			<tr>
				<td><code>DOCUMENT_FRAGMENT_NODE</code></td>
				<td><code>11</code></td>
			</tr>
			<tr>
				<td><code>NOTATION_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>12</code></td>
			</tr>
		</tbody>
	</table>
</code>

	

#### **Type**: `Promise<number>`

### .nodeValue <div class="specs"><i>W3C</i></div> {#nodeValue}

Returns / Sets the value of the current node.

#### **Type**: `Promise<string>`

### .ownerDocument <div class="specs"><i>W3C</i></div> {#ownerDocument}

Returns the <code>Document</code> that this node belongs to. If the node is itself a document, returns <code>null</code>.

#### **Type**: [`SuperDocument`](./super-document)

### .parentElement <div class="specs"><i>W3C</i></div> {#parentElement}

Returns an <code>Element</code> that is the parent of this node. If the node has no parent, or if that parent is not an <code>Element</code>, this property returns <code>null</code>.

#### **Type**: [`SuperElement`](./super-element)

### .parentNode <div class="specs"><i>W3C</i></div> {#parentNode}

Returns a <code>Node</code> that is the parent of this node. If there is no such node, like if this node is the top of the tree or if doesn't participate in a tree, this property returns <code>null</code>.

#### **Type**: [`SuperNode`](./super-node)

### .previousSibling <div class="specs"><i>W3C</i></div> {#previousSibling}

Returns a <code>Node</code> representing the previous node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: [`SuperNode`](./super-node)

### .textContent <div class="specs"><i>W3C</i></div> {#textContent}

Returns / Sets the textual content of an element and all its descendants.

#### **Type**: `Promise<string>`

### .activeElement <div class="specs"><i>W3C</i></div> {#activeElement}

Returns the <code>Element</code> within the shadow tree that has focus.

#### **Type**: [`SuperElement`](./super-element)

### .fullscreenElement <div class="specs"><i>W3C</i></div> {#fullscreenElement}

Returns the <code>Element</code> that's currently in full screen mode for this document.

#### **Type**: [`SuperElement`](./super-element)

### .pointerLockElement <div class="specs"><i>W3C</i></div> {#pointerLockElement}

Returns the element set as the target for mouse events while the pointer is locked. It returns&nbsp;<code>null</code> if lock is pending, the pointer is unlocked, or if the target is in another document.

#### **Type**: [`SuperElement`](./super-element)

### .childElementCount <div class="specs"><i>W3C</i></div> {#childElementCount}

Returns the number of children of this <code>ParentNode</code> which are elements.

#### **Type**: `Promise<number>`

### .children <div class="specs"><i>W3C</i></div> {#children}

Returns a live <code>HTMLCollection</code> containing all of the <code>Element</code> objects that are children of this <code>ParentNode</code>, omitting all of its non-element nodes.

#### **Type**: [`SuperHTMLCollection`](./super-html-collection)

### .firstElementChild <div class="specs"><i>W3C</i></div> {#firstElementChild}

Returns the first node which is both a child of this <code>ParentNode</code> <em>and</em> is also an <code>Element</code>, or <code>null</code> if there is none.

#### **Type**: [`SuperElement`](./super-element)

### .lastElementChild <div class="specs"><i>W3C</i></div> {#lastElementChild}

Returns the last node which is both a child of this <code>ParentNode</code> <em>and</em> is an <code>Element</code>, or <code>null</code> if there is none.

#### **Type**: [`SuperElement`](./super-element)

## Methods

### .compareDocumentPosition*(other)* <div class="specs"><i>W3C</i></div> {#compareDocumentPosition}

Compares the position of the current node against another node in any other document.

#### **Arguments**:


 - other [`Node`](./node). The other <code>Node</code> with which to compare the first *<code>node</code>*’s document position.

#### **Returns**: `Promise<number>`

### .contains*(other)* <div class="specs"><i>W3C</i></div> {#contains}

Returns a `boolean` value indicating whether or not a node is a descendant of the calling node.

#### **Arguments**:


 - other [`Node`](./node). Needs content.

#### **Returns**: `Promise<boolean>`

### .getRootNode*(options?)* <div class="specs"><i>W3C</i></div> {#getRootNode}

Returns the context object's root which optionally includes the shadow root if it is available.&nbsp;

#### **Arguments**:


 - options `GetRootNodeOptions`. An object that sets options for getting the root node. The available options are:
     <ul>
      <li><code>composed</code>: A `boolean` that indicates whether the shadow root should be returned (<code>false</code>, the default), or a root node beyond shadow root (<code>true</code>).</li>
     </ul>

#### **Returns**: [`SuperNode`](./super-node)

### .hasChildNodes*()* <div class="specs"><i>W3C</i></div> {#hasChildNodes}

Returns a `boolean` indicating whether or not the element has any child nodes.

#### **Returns**: `Promise<boolean>`

### .isDefaultNamespace*(namespace)* <div class="specs"><i>W3C</i></div> {#isDefaultNamespace}

Accepts a namespace URI as an argument and returns a&nbsp;`boolean`&nbsp;with a value of&nbsp;<code>true</code>&nbsp;if the namespace is the default namespace on the given node or&nbsp;<code>false</code>&nbsp;if not.

#### **Arguments**:


 - namespace `string`. <code>namespaceURI</code> is a string representing the namespace against which the element will be checked.

#### **Returns**: `Promise<boolean>`

### .isEqualNode*(otherNode)* <div class="specs"><i>W3C</i></div> {#isEqualNode}

Returns a `boolean` which indicates whether or not two nodes are of the same type and all their defining data points match.

#### **Arguments**:


 - otherNode [`Node`](./node). <code>otherNode</code>: The <code>Node</code> to compare equality with.

#### **Returns**: `Promise<boolean>`

### .isSameNode*(otherNode)* <div class="specs"><i>W3C</i></div> {#isSameNode}

Returns a `boolean` value indicating whether or not the two nodes are the same (that is, they reference the same object).

#### **Arguments**:


 - otherNode [`Node`](./node). <code><var>otherNode</var></code>&nbsp;The <code>Node</code> to test against.

#### **Returns**: `Promise<boolean>`

### .lookupNamespaceURI*(prefix)* <div class="specs"><i>W3C</i></div> {#lookupNamespaceURI}

Accepts a prefix and returns the namespace URI associated with it on the given node if found (and&nbsp;<code>null</code>&nbsp;if not). Supplying&nbsp;<code>null</code>&nbsp;for the prefix will return the default namespace.

#### **Arguments**:


 - prefix `string`. The prefix to look for. If this parameter is <code>null</code>, the method will return the default namespace URI, if any.

#### **Returns**: `Promise<string>`

### .lookupPrefix*(namespace)* <div class="specs"><i>W3C</i></div> {#lookupPrefix}

Returns a&nbsp;`string` containing the prefix for a given namespace URI, if present, and&nbsp;<code>null</code>&nbsp;if not. When multiple prefixes are possible, the result is implementation-dependent.

#### **Arguments**:


 - namespace `string`. Needs content.

#### **Returns**: `Promise<string>`

### .normalize*()* <div class="specs"><i>W3C</i></div> {#normalize}

Clean up all the text nodes under this element (merge adjacent, remove empty).

#### **Returns**: `Promise<void>`

### .caretPositionFromPoint*(x, y)* <div class="specs"><i>W3C</i></div> {#caretPositionFromPoint}

Returns a <code>CaretPosition</code> object containing the DOM node containing the caret, and caret's character offset within that node.

#### **Arguments**:


 - x `number`. The horizontal coordinate of a point.
 - y `number`. The vertical coordinate of a point.

#### **Returns**: [`CaretPosition`](./caret-position)

### .elementFromPoint*(x, y)* <div class="specs"><i>W3C</i></div> {#elementFromPoint}

Returns the topmost element at the specified coordinates.

#### **Arguments**:


 - x `number`. The horizontal coordinate of a point, relative to the left edge of the current viewport.
 - y `number`. The vertical coordinate of a point, relative to the top edge of the current viewport.

#### **Returns**: [`SuperElement`](./super-element)

### .getSelection*()* <div class="specs"><i>W3C</i></div> {#getSelection}

Returns a <code>Selection</code> object representing the range of text selected by the user, or the current position of the caret.

#### **Returns**: [`Selection`](./selection)

### .getElementById*(elementId)* <div class="specs"><i>W3C</i></div> {#getElementById}

Needs content.

#### **Arguments**:


 - elementId `string`. Needs content.

#### **Returns**: [`SuperElement`](./super-element)

### .querySelector*(selectors)* <div class="specs"><i>W3C</i></div> {#querySelector}

Returns the first <code>Element</code> with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - selectors `string`. A `string` containing one or more selectors to match against. This string must be a valid compound selector list supported by the browser; if it's not, a <code>SyntaxError</code> exception is thrown. See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors" target="mdnrel">Locating DOM elements using selectors</a> for more information about using selectors to identify elements. Multiple selectors may be specified by separating them using commas.

#### **Returns**: [`SuperElement`](./super-element)

### .querySelectorAll*(selectors)* <div class="specs"><i>W3C</i></div> {#querySelectorAll}

Returns a <code>NodeList</code> representing a list of elements with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - selectors `string`. A `string` containing one or more selectors to match against. This string must be a valid CSS selector string; if it's not, a <code>SyntaxError</code> exception is thrown. See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors" target="mdnrel">Locating DOM elements using selectors</a> for more information about using selectors to identify elements. Multiple selectors may be specified by separating them using commas.

#### **Returns**: [`SuperNodeList`](./super-node-list)

## Unimplemented Specs

#### Methods

 |   |   | 
 | --- | --- | 
 | `appendChild()` | `cloneNode()`
`insertBefore()` | `removeChild()`
`replaceChild()` | `addEventListener()`
`dispatchEvent()` | `removeEventListener()`
`elementsFromPoint()` | `append()`
`prepend()` |  | 
