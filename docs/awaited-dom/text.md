# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> Text

<div class='overview'><span class="seoSummary">The <strong><code>Text</code></strong> interface represents the textual content of <code>Element</code> or <code>Attr</code>. </span></div>

<div class='overview'>If an element has no markup within its content, it has a single child implementing <code>Text</code> that contains the element's text. However, if the element contains markup, it is parsed into information items and <code>Text</code> nodes that form its children.</div>

<div class='overview'>New documents have a single <code>Text</code> node for each block of text. Over time, more <code>Text</code> nodes may be created as the document's content changes. The <code>Node.normalize()</code> method merges adjacent <code>Text</code> objects back into a single node for each block of text.</div>

## Properties

### node.wholeText <div class="specs"><i>W3C</i></div> {#wholeText}

Returns a `string` containing the text of all <code>Text</code> nodes logically adjacent to this <code>Node</code>, concatenated in document order.

#### **Type**: `Promise<string>`

### node.data <div class="specs"><i>W3C</i></div> {#data}

Is a `string` representing the textual data contained in this object.

#### **Type**: `Promise<string>`

### node.length <div class="specs"><i>W3C</i></div> {#length}

Returns an <code>unsigned long</code> representing the size of the string contained in <code>CharacterData.data</code>.

#### **Type**: `Promise<number>`

### node.baseURI <div class="specs"><i>W3C</i></div> {#baseURI}

Returns a `string` representing the base URL of the document containing the <code>Node</code>.

#### **Type**: `Promise<string>`

### node.childNodes <div class="specs"><i>W3C</i></div> {#childNodes}

Returns a live <code>NodeList</code> containing all the children of this node. <code>NodeList</code> being live means that if the children of the <code>Node</code> change, the <code>NodeList</code> object is automatically updated.

#### **Type**: [`SuperNodeList`](./super-node-list.md)

### node.firstChild <div class="specs"><i>W3C</i></div> {#firstChild}

Returns a <code>Node</code> representing the first direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: [`SuperNode`](./super-node.md)

### node.isConnected <div class="specs"><i>W3C</i></div> {#isConnected}

A boolean indicating whether or not the Node is connected (directly or indirectly) to the context object, e.g. the <code>Document</code> object in the case of the normal DOM, or the <code>ShadowRoot</code> in the case of a shadow DOM.

#### **Type**: `Promise<boolean>`

### node.lastChild <div class="specs"><i>W3C</i></div> {#lastChild}

Returns a <code>Node</code> representing the last direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: [`SuperNode`](./super-node.md)

### node.nextSibling <div class="specs"><i>W3C</i></div> {#nextSibling}

Returns a <code>Node</code> representing the next node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: [`SuperNode`](./super-node.md)

### node.nodeName <div class="specs"><i>W3C</i></div> {#nodeName}

Returns a `string` containing the name of the <code>Node</code>. The structure of the name will differ with the node type. E.g. An <code>HTMLElement</code> will contain the name of the corresponding tag, like <code>'audio'</code> for an <code>HTMLAudioElement</code>, a <code>Text</code> node will have the <code>'#text'</code> string, or a <code>Document</code> node will have the <code>'#document'</code> string.

#### **Type**: `Promise<string>`

### node.nodeType <div class="specs"><i>W3C</i></div> {#nodeType}

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

### node.nodeValue <div class="specs"><i>W3C</i></div> {#nodeValue}

Returns the value of the current node.

#### **Type**: `Promise<string>`

### node.ownerDocument <div class="specs"><i>W3C</i></div> {#ownerDocument}

Returns the <code>Document</code> that this node belongs to. If the node is itself a document, returns <code>null</code>.

#### **Type**: [`SuperDocument`](./super-document.md)

### node.parentElement <div class="specs"><i>W3C</i></div> {#parentElement}

Returns an <code>Element</code> that is the parent of this node. If the node has no parent, or if that parent is not an <code>Element</code>, this property returns <code>null</code>.

#### **Type**: [`SuperElement`](./super-element.md)

### node.parentNode <div class="specs"><i>W3C</i></div> {#parentNode}

Returns a <code>Node</code> that is the parent of this node. If there is no such node, like if this node is the top of the tree or if doesn't participate in a tree, this property returns <code>null</code>.

#### **Type**: [`SuperNode`](./super-node.md)

### node.previousSibling <div class="specs"><i>W3C</i></div> {#previousSibling}

Returns a <code>Node</code> representing the previous node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: [`SuperNode`](./super-node.md)

### node.textContent <div class="specs"><i>W3C</i></div> {#textContent}

Returns the textual content of an element and all its descendants.

#### **Type**: `Promise<string>`

### node.assignedSlot <div class="specs"><i>W3C</i></div> {#assignedSlot}

Returns the <code>&lt;slot&gt;</code> the node is inserted in.

#### **Type**: [`HTMLSlotElement`](./html-slot-element.md)

### node.nextElementSibling <div class="specs"><i>W3C</i></div> {#nextElementSibling}

Returns the <code>Element</code> immediately following this node in its parent's children list, or <code>null</code> if there is no <code>Element</code> in the list following this node.

#### **Type**: [`SuperElement`](./super-element.md)

### node.previousElementSibling <div class="specs"><i>W3C</i></div> {#previousElementSibling}

Returns the <code>Element</code> immediately prior to this node in its parent's children list, or <code>null</code> if there is no <code>Element</code> in the list prior to this node.

#### **Type**: [`SuperElement`](./super-element.md)

## Methods

### node.splitText *(offset)* <div class="specs"><i>W3C</i></div> {#splitText}

Breaks the node into two nodes at a specified offset.

#### **Arguments**:


 - offset `number`. The index immediately before which to break the text node.

#### **Returns**: `Promise<SuperText>`

### node.substringData *(offset, count)* <div class="specs"><i>W3C</i></div> {#substringData}

Returns a `string` containing the part of <code>CharacterData.data</code> of the specified length and starting at the specified offset.

#### **Arguments**:


 - offset `number`. Needs content.
 - count `number`. Needs content.

#### **Returns**: `Promise<string>`

### node.compareDocumentPosition *(other)* <div class="specs"><i>W3C</i></div> {#compareDocumentPosition}

Compares the position of the current node against another node in any other document.

#### **Arguments**:


 - other [`Node`](./node.md). The other <code>Node</code> with which to compare the first *<code>node</code>*’s document position.

#### **Returns**: `Promise<number>`

### node.contains *(other)* <div class="specs"><i>W3C</i></div> {#contains}

Returns a `boolean` value indicating whether or not a node is a descendant of the calling node.

#### **Arguments**:


 - other [`Node`](./node.md). Needs content.

#### **Returns**: `Promise<boolean>`

### node.getRootNode *(options?)* <div class="specs"><i>W3C</i></div> {#getRootNode}

Returns the context object's root which optionally includes the shadow root if it is available.&nbsp;

#### **Arguments**:


 - options `GetRootNodeOptions`. An object that sets options for getting the root node. The available options are:
     <ul>
      <li><code>composed</code>: A `boolean` that indicates whether the shadow root should be returned (<code>false</code>, the default), or a root node beyond shadow root (<code>true</code>).</li>
     </ul>

#### **Returns**: [`SuperNode`](./super-node.md)

### node.hasChildNodes *()* <div class="specs"><i>W3C</i></div> {#hasChildNodes}

Returns a `boolean` indicating whether or not the element has any child nodes.

#### **Returns**: `Promise<boolean>`

### node.isDefaultNamespace *(namespace)* <div class="specs"><i>W3C</i></div> {#isDefaultNamespace}

Accepts a namespace URI as an argument and returns a&nbsp;`boolean`&nbsp;with a value of&nbsp;<code>true</code>&nbsp;if the namespace is the default namespace on the given node or&nbsp;<code>false</code>&nbsp;if not.

#### **Arguments**:


 - namespace `string`. <code>namespaceURI</code> is a string representing the namespace against which the element will be checked.

#### **Returns**: `Promise<boolean>`

### node.isEqualNode *(otherNode)* <div class="specs"><i>W3C</i></div> {#isEqualNode}

Returns a `boolean` which indicates whether or not two nodes are of the same type and all their defining data points match.

#### **Arguments**:


 - otherNode [`Node`](./node.md). <code>otherNode</code>: The <code>Node</code> to compare equality with.

#### **Returns**: `Promise<boolean>`

### node.isSameNode *(otherNode)* <div class="specs"><i>W3C</i></div> {#isSameNode}

Returns a `boolean` value indicating whether or not the two nodes are the same (that is, they reference the same object).

#### **Arguments**:


 - otherNode [`Node`](./node.md). <code><var>otherNode</var></code>&nbsp;The <code>Node</code> to test against.

#### **Returns**: `Promise<boolean>`

### node.lookupNamespaceURI *(prefix)* <div class="specs"><i>W3C</i></div> {#lookupNamespaceURI}

Accepts a prefix and returns the namespace URI associated with it on the given node if found (and&nbsp;<code>null</code>&nbsp;if not). Supplying&nbsp;<code>null</code>&nbsp;for the prefix will return the default namespace.

#### **Arguments**:


 - prefix `string`. The prefix to look for. If this parameter is <code>null</code>, the method will return the default namespace URI, if any.

#### **Returns**: `Promise<string>`

### node.lookupPrefix *(namespace)* <div class="specs"><i>W3C</i></div> {#lookupPrefix}

Returns a&nbsp;`string` containing the prefix for a given namespace URI, if present, and&nbsp;<code>null</code>&nbsp;if not. When multiple prefixes are possible, the result is implementation-dependent.

#### **Arguments**:


 - namespace `string`. Needs content.

#### **Returns**: `Promise<string>`

### node.normalize *()* <div class="specs"><i>W3C</i></div> {#normalize}

Clean up all the text nodes under this element (merge adjacent, remove empty).

#### **Returns**: `Promise<void>`

## Unimplemented Specs

#### Methods

|     |     |
| --- | --- |
| `appendData()` | `deleteData()` |
| `insertData()` | `replaceData()` |
| `appendChild()` | `cloneNode()` |
| `insertBefore()` | `removeChild()` |
| `replaceChild()` | `addEventListener()` |
| `dispatchEvent()` | `removeEventListener()` |
| `after()` | `before()` |
| `remove()` | `replaceWith()` |
