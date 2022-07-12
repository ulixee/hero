# [AwaitedDOM](/docs/hero/basic-client/awaited-dom) <span>/</span> Attr

<div class='overview'>The <code><strong>Attr</strong></code> interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., <code>Element.getAttribute()</code>), but certain functions (e.g., <code>Element.getAttributeNode()</code>) or means of iterating return <code>Attr</code> types.</div>

## Properties

### .localName <div class="specs"><i>W3C</i></div> {#localName}

A `string` representing the local part of the qualified name of the attribute.

#### **Type**: `Promise<string>`

### .name <div class="specs"><i>W3C</i></div> {#name}

The attribute's name.

#### **Type**: `Promise<string>`

### .namespaceURI <div class="specs"><i>W3C</i></div> {#namespaceURI}

A `string` representing the namespace URI of the attribute, or <code>null</code> if there is no namespace.

#### **Type**: `Promise<string>`

### .ownerElement <div class="specs"><i>W3C</i></div> {#ownerElement}


 <p>The element holding the attribute.</p>
 <div class="note">
 <p><strong>Note:</strong> DOM Level 4 removed this property. The assumption was that since you get an <code>Attr</code> object from an <code>Element</code>, you should already know the associated element.<br>
  As that doesn't hold true in cases like <code>Attr</code> objects being returned by <code>Document.evaluate</code>, the DOM Living Standard reintroduced the property.</p>
 <p>Gecko outputs a deprecation note starting from Gecko 7.0 (Firefox 7.0 / Thunderbird 7.0 / SeaMonkey 2.4). This note was removed again in Gecko 49.0 (Firefox 49.0 / Thunderbird 49.0 / SeaMonkey 2.46).</p>
 </div>
 

#### **Type**: [`SuperElement`](/docs/hero/awaited-dom/super-element)

### .prefix <div class="specs"><i>W3C</i></div> {#prefix}

A `string` representing the namespace prefix of the attribute, or <code>null</code> if no prefix is specified.

#### **Type**: `Promise<string>`

### .specified <div class="specs"><i>W3C</i></div> {#specified}

This property always returns <code>true</code>. Originally, it returned <code>true </code>if the attribute was explicitly specified in the source code or by a script, and <code>false</code> if its value came from the default one defined in the document's <acronym title="Document Type Definition">DTD</acronym>.

#### **Type**: `Promise<boolean>`

### .value <div class="specs"><i>W3C</i></div> {#value}

The attribute's value.

#### **Type**: `Promise<string>`

### .baseURI <div class="specs"><i>W3C</i></div> {#baseURI}

Returns a `string` representing the base URL of the document containing the <code>Node</code>.

#### **Type**: `Promise<string>`

### .childNodes <div class="specs"><i>W3C</i></div> {#childNodes}

Returns a live <code>NodeList</code> containing all the children of this node. <code>NodeList</code> being live means that if the children of the <code>Node</code> change, the <code>NodeList</code> object is automatically updated.

#### **Type**: [`SuperNodeList`](/docs/hero/awaited-dom/super-node-list)

### .firstChild <div class="specs"><i>W3C</i></div> {#firstChild}

Returns a <code>Node</code> representing the first direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: [`SuperNode`](/docs/hero/awaited-dom/super-node)

### .isConnected <div class="specs"><i>W3C</i></div> {#isConnected}

A boolean indicating whether or not the Node is connected (directly or indirectly) to the context object, e.g. the <code>Document</code> object in the case of the normal DOM, or the <code>ShadowRoot</code> in the case of a shadow DOM.

#### **Type**: `Promise<boolean>`

### .lastChild <div class="specs"><i>W3C</i></div> {#lastChild}

Returns a <code>Node</code> representing the last direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: [`SuperNode`](/docs/hero/awaited-dom/super-node)

### .nextSibling <div class="specs"><i>W3C</i></div> {#nextSibling}

Returns a <code>Node</code> representing the next node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: [`SuperNode`](/docs/hero/awaited-dom/super-node)

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

#### **Type**: [`SuperDocument`](/docs/hero/awaited-dom/super-document)

### .parentElement <div class="specs"><i>W3C</i></div> {#parentElement}

Returns an <code>Element</code> that is the parent of this node. If the node has no parent, or if that parent is not an <code>Element</code>, this property returns <code>null</code>.

#### **Type**: [`SuperElement`](/docs/hero/awaited-dom/super-element)

### .parentNode <div class="specs"><i>W3C</i></div> {#parentNode}

Returns a <code>Node</code> that is the parent of this node. If there is no such node, like if this node is the top of the tree or if doesn't participate in a tree, this property returns <code>null</code>.

#### **Type**: [`SuperNode`](/docs/hero/awaited-dom/super-node)

### .previousSibling <div class="specs"><i>W3C</i></div> {#previousSibling}

Returns a <code>Node</code> representing the previous node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: [`SuperNode`](/docs/hero/awaited-dom/super-node)

### .textContent <div class="specs"><i>W3C</i></div> {#textContent}

Returns / Sets the textual content of an element and all its descendants.

#### **Type**: `Promise<string>`

## Methods

### .compareDocumentPosition *(other)* <div class="specs"><i>W3C</i></div> {#compareDocumentPosition}

Compares the position of the current node against another node in any other document.

#### **Arguments**:


 - other [`Node`](/docs/hero/awaited-dom/node). The other <code>Node</code> with which to compare the first *<code>node</code>*’s document position.

#### **Returns**: `Promise<number>`

### .contains *(other)* <div class="specs"><i>W3C</i></div> {#contains}

Returns a `boolean` value indicating whether or not a node is a descendant of the calling node.

#### **Arguments**:


 - other [`Node`](/docs/hero/awaited-dom/node). Needs content.

#### **Returns**: `Promise<boolean>`

### .getRootNode *(options?)* <div class="specs"><i>W3C</i></div> {#getRootNode}

Returns the context object's root which optionally includes the shadow root if it is available.&nbsp;

#### **Arguments**:


 - options `GetRootNodeOptions`. An object that sets options for getting the root node. The available options are:
     <ul>
      <li><code>composed</code>: A `boolean` that indicates whether the shadow root should be returned (<code>false</code>, the default), or a root node beyond shadow root (<code>true</code>).</li>
     </ul>

#### **Returns**: [`SuperNode`](/docs/hero/awaited-dom/super-node)

### .hasChildNodes *()* <div class="specs"><i>W3C</i></div> {#hasChildNodes}

Returns a `boolean` indicating whether or not the element has any child nodes.

#### **Returns**: `Promise<boolean>`

### .isDefaultNamespace *(namespace)* <div class="specs"><i>W3C</i></div> {#isDefaultNamespace}

Accepts a namespace URI as an argument and returns a&nbsp;`boolean`&nbsp;with a value of&nbsp;<code>true</code>&nbsp;if the namespace is the default namespace on the given node or&nbsp;<code>false</code>&nbsp;if not.

#### **Arguments**:


 - namespace `string`. <code>namespaceURI</code> is a string representing the namespace against which the element will be checked.

#### **Returns**: `Promise<boolean>`

### .isEqualNode *(otherNode)* <div class="specs"><i>W3C</i></div> {#isEqualNode}

Returns a `boolean` which indicates whether or not two nodes are of the same type and all their defining data points match.

#### **Arguments**:


 - otherNode [`Node`](/docs/hero/awaited-dom/node). <code>otherNode</code>: The <code>Node</code> to compare equality with.

#### **Returns**: `Promise<boolean>`

### .isSameNode *(otherNode)* <div class="specs"><i>W3C</i></div> {#isSameNode}

Returns a `boolean` value indicating whether or not the two nodes are the same (that is, they reference the same object).

#### **Arguments**:


 - otherNode [`Node`](/docs/hero/awaited-dom/node). <code><var>otherNode</var></code>&nbsp;The <code>Node</code> to test against.

#### **Returns**: `Promise<boolean>`

### .lookupNamespaceURI *(prefix)* <div class="specs"><i>W3C</i></div> {#lookupNamespaceURI}

Accepts a prefix and returns the namespace URI associated with it on the given node if found (and&nbsp;<code>null</code>&nbsp;if not). Supplying&nbsp;<code>null</code>&nbsp;for the prefix will return the default namespace.

#### **Arguments**:


 - prefix `string`. The prefix to look for. If this parameter is <code>null</code>, the method will return the default namespace URI, if any.

#### **Returns**: `Promise<string>`

### .lookupPrefix *(namespace)* <div class="specs"><i>W3C</i></div> {#lookupPrefix}

Returns a&nbsp;`string` containing the prefix for a given namespace URI, if present, and&nbsp;<code>null</code>&nbsp;if not. When multiple prefixes are possible, the result is implementation-dependent.

#### **Arguments**:


 - namespace `string`. Needs content.

#### **Returns**: `Promise<string>`

### .normalize *()* <div class="specs"><i>W3C</i></div> {#normalize}

Clean up all the text nodes under this element (merge adjacent, remove empty).

#### **Returns**: `Promise<void>`

## Unimplemented Specs

#### Methods

|     |     |
| --- | --- |
| `appendChild()` | `cloneNode()` |
| `insertBefore()` | `removeChild()` |
| `replaceChild()` | `addEventListener()` |
| `dispatchEvent()` | `removeEventListener()` |
