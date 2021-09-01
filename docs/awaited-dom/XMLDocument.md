# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> XMLDocument

<div class='overview'>The <strong>XMLDocument</strong> interface represents an XML document. It inherits from the generic <code>Document</code> and does not add any specific methods or properties to it: nevertheless, several algorithms behave differently with the two types of documents.</div>

## Properties

### doc.anchors <div class="specs"><i>W3C</i></div> {#anchors}

Returns a list of all of the anchors in the document.

#### **Type**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.body <div class="specs"><i>W3C</i></div> {#body}

Returns the <code>&lt;body&gt;</code> or <code>&lt;frameset&gt;</code> node of the current document.

#### **Type**: [`SuperHTMLElement`](/docs/awaited-dom/super-html-element)

### doc.characterSet <div class="specs"><i>W3C</i></div> {#characterSet}

Returns the character set being used by the document.

#### **Type**: `Promise<string>`

### doc.compatMode <div class="specs"><i>W3C</i></div> {#compatMode}

Indicates whether the document is rendered in <em>quirks</em> or <em>strict</em> mode.

#### **Type**: `Promise<string>`

### doc.contentType <div class="specs"><i>W3C</i></div> {#contentType}

Returns the Content-Type from the MIME Header of the current document.

#### **Type**: `Promise<string>`

### doc.cookie <div class="specs"><i>W3C</i></div> {#cookie}

Returns a semicolon-separated list of the cookies for that document or sets a single cookie.

#### **Type**: `Promise<string>`

### doc.designMode <div class="specs"><i>W3C</i></div> {#designMode}

Gets/sets the ability to edit the whole document.

#### **Type**: `Promise<string>`

### doc.dir <div class="specs"><i>W3C</i></div> {#dir}

Gets/sets directionality (rtl/ltr) of the document.

#### **Type**: `Promise<string>`

### doc.doctype <div class="specs"><i>W3C</i></div> {#doctype}

Returns the Document Type Definition (DTD) of the current document.

#### **Type**: [`DocumentType`](/docs/awaited-dom/document-type)

### doc.documentElement <div class="specs"><i>W3C</i></div> {#documentElement}

Returns the <code>Element</code> that is a direct child of the document. For HTML documents, this is normally the <code>HTMLHtmlElement</code> object representing the document's <code>&lt;html&gt;</code> element.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### doc.documentURI <div class="specs"><i>W3C</i></div> {#documentURI}

Returns the document location as a string.

#### **Type**: `Promise<string>`

### doc.domain <div class="specs"><i>W3C</i></div> {#domain}

Gets/sets the domain of the current document.

#### **Type**: `Promise<string>`

### doc.embeds <div class="specs"><i>W3C</i></div> {#embeds}

Returns a list of the embedded <code>&lt;embed&gt;</code> elements within the current document.

#### **Type**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.featurePolicy <div class="specs"><i>W3C</i></div> {#featurePolicy}

Returns the <code>FeaturePolicy</code> interface which provides a simple API for introspecting the feature policies applied to a specific document.

#### **Type**: `FeaturePolicy`

### doc.forms <div class="specs"><i>W3C</i></div> {#forms}

Returns a list of the <code>&lt;form&gt;</code> elements within the current document.

#### **Type**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.fullscreenEnabled <div class="specs"><i>W3C</i></div> {#fullscreenEnabled}

Indicates whether or not full-screen mode is available.

#### **Type**: `Promise<boolean>`

### doc.head <div class="specs"><i>W3C</i></div> {#head}

Returns the <code>&lt;head&gt;</code> element of the current document.

#### **Type**: [`HTMLHeadElement`](/docs/awaited-dom/html-head-element)

### doc.hidden <div class="specs"><i>W3C</i></div> {#hidden}

Returns a Boolean value indicating if the page is considered hidden or not.

#### **Type**: `Promise<boolean>`

### doc.images <div class="specs"><i>W3C</i></div> {#images}

Returns a list of the images in the current document.

#### **Type**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.implementation <div class="specs"><i>W3C</i></div> {#implementation}

Returns the DOM implementation associated with the current document.

#### **Type**: [`DOMImplementation`](/docs/awaited-dom/dom-implementation)

### doc.lastModified <div class="specs"><i>W3C</i></div> {#lastModified}

Returns the date on which the document was last modified.

#### **Type**: `Promise<string>`

### doc.links <div class="specs"><i>W3C</i></div> {#links}

Returns a list of all the hyperlinks in the document.

#### **Type**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.location <div class="specs"><i>W3C</i></div> {#location}

Returns the URI of the current document.

#### **Type**: [`Location`](/docs/awaited-dom/location)

### doc.plugins <div class="specs"><i>W3C</i></div> {#plugins}

Returns a list of the available plugins.

#### **Type**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.readyState <div class="specs"><i>W3C</i></div> {#readyState}

Returns loading status of the document.

#### **Type**: `Promise<DocumentReadyState>`

### doc.referrer <div class="specs"><i>W3C</i></div> {#referrer}

Returns the URI of the page that linked to this page.

#### **Type**: `Promise<string>`

### doc.scripts <div class="specs"><i>W3C</i></div> {#scripts}

Returns all the <code>&lt;script&gt;</code> elements on the document.

#### **Type**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.scrollingElement <div class="specs"><i>W3C</i></div> {#scrollingElement}

Returns a reference to the <code>Element</code> that scrolls the document.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### doc.title <div class="specs"><i>W3C</i></div> {#title}

Sets or gets the title of the current document.

#### **Type**: `Promise<string>`

### doc.URL <div class="specs"><i>W3C</i></div> {#URL}

Returns the document location as a string.

#### **Type**: `Promise<string>`

### doc.visibilityState <div class="specs"><i>W3C</i></div> {#visibilityState}

Returns a <code>string</code> denoting the visibility state of the document. Possible values are <code>visible</code>, <code>hidden</code>, <code>prerender</code>, and <code>unloaded</code>.

#### **Type**: `Promise<VisibilityState>`

### doc.baseURI <div class="specs"><i>W3C</i></div> {#baseURI}

Returns a `string` representing the base URL of the document containing the <code>Node</code>.

#### **Type**: `Promise<string>`

### doc.childNodes <div class="specs"><i>W3C</i></div> {#childNodes}

Returns a live <code>NodeList</code> containing all the children of this node. <code>NodeList</code> being live means that if the children of the <code>Node</code> change, the <code>NodeList</code> object is automatically updated.

#### **Type**: [`SuperNodeList`](/docs/awaited-dom/super-node-list)

### doc.firstChild <div class="specs"><i>W3C</i></div> {#firstChild}

Returns a <code>Node</code> representing the first direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: [`SuperNode`](/docs/awaited-dom/super-node)

### doc.isConnected <div class="specs"><i>W3C</i></div> {#isConnected}

A boolean indicating whether or not the Node is connected (directly or indirectly) to the context object, e.g. the <code>Document</code> object in the case of the normal DOM, or the <code>ShadowRoot</code> in the case of a shadow DOM.

#### **Type**: `Promise<boolean>`

### doc.lastChild <div class="specs"><i>W3C</i></div> {#lastChild}

Returns a <code>Node</code> representing the last direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: [`SuperNode`](/docs/awaited-dom/super-node)

### doc.nextSibling <div class="specs"><i>W3C</i></div> {#nextSibling}

Returns a <code>Node</code> representing the next node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: [`SuperNode`](/docs/awaited-dom/super-node)

### doc.nodeName <div class="specs"><i>W3C</i></div> {#nodeName}

Returns a `string` containing the name of the <code>Node</code>. The structure of the name will differ with the node type. E.g. An <code>HTMLElement</code> will contain the name of the corresponding tag, like <code>'audio'</code> for an <code>HTMLAudioElement</code>, a <code>Text</code> node will have the <code>'#text'</code> string, or a <code>Document</code> node will have the <code>'#document'</code> string.

#### **Type**: `Promise<string>`

### doc.nodeType <div class="specs"><i>W3C</i></div> {#nodeType}

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

### doc.nodeValue <div class="specs"><i>W3C</i></div> {#nodeValue}

Returns / Sets the value of the current node.

#### **Type**: `Promise<string>`

### doc.ownerDocument <div class="specs"><i>W3C</i></div> {#ownerDocument}

Returns the <code>Document</code> that this node belongs to. If the node is itself a document, returns <code>null</code>.

#### **Type**: [`SuperDocument`](/docs/awaited-dom/super-document)

### doc.parentElement <div class="specs"><i>W3C</i></div> {#parentElement}

Returns an <code>Element</code> that is the parent of this node. If the node has no parent, or if that parent is not an <code>Element</code>, this property returns <code>null</code>.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### doc.parentNode <div class="specs"><i>W3C</i></div> {#parentNode}

Returns a <code>Node</code> that is the parent of this node. If there is no such node, like if this node is the top of the tree or if doesn't participate in a tree, this property returns <code>null</code>.

#### **Type**: [`SuperNode`](/docs/awaited-dom/super-node)

### doc.previousSibling <div class="specs"><i>W3C</i></div> {#previousSibling}

Returns a <code>Node</code> representing the previous node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: [`SuperNode`](/docs/awaited-dom/super-node)

### doc.textContent <div class="specs"><i>W3C</i></div> {#textContent}

Returns / Sets the textual content of an element and all its descendants.

#### **Type**: `Promise<string>`

### doc.activeElement <div class="specs"><i>W3C</i></div> {#activeElement}

Returns the <code>Element</code> within the shadow tree that has focus.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### doc.fullscreenElement <div class="specs"><i>W3C</i></div> {#fullscreenElement}

Returns the <code>Element</code> that's currently in full screen mode for this document.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### doc.pointerLockElement <div class="specs"><i>W3C</i></div> {#pointerLockElement}

Returns the element set as the target for mouse events while the pointer is locked. It returns&nbsp;<code>null</code> if lock is pending, the pointer is unlocked, or if the target is in another document.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### doc.childElementCount <div class="specs"><i>W3C</i></div> {#childElementCount}

Returns the number of children of this <code>ParentNode</code> which are elements.

#### **Type**: `Promise<number>`

### doc.children <div class="specs"><i>W3C</i></div> {#children}

Returns a live <code>HTMLCollection</code> containing all of the <code>Element</code> objects that are children of this <code>ParentNode</code>, omitting all of its non-element nodes.

#### **Type**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.firstElementChild <div class="specs"><i>W3C</i></div> {#firstElementChild}

Returns the first node which is both a child of this <code>ParentNode</code> <em>and</em> is also an <code>Element</code>, or <code>null</code> if there is none.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### doc.lastElementChild <div class="specs"><i>W3C</i></div> {#lastElementChild}

Returns the last node which is both a child of this <code>ParentNode</code> <em>and</em> is an <code>Element</code>, or <code>null</code> if there is none.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

## Methods

### doc.exitFullscreen*()* <div class="specs"><i>W3C</i></div> {#exitFullscreen}

Requests that the element on this document which is currently being presented in full-screen mode be taken out of full-screen mode, restoring the previous state of the screen.

#### **Returns**: `Promise<void>`

### doc.exitPointerLock*()* <div class="specs"><i>W3C</i></div> {#exitPointerLock}

Release the pointer lock.

#### **Returns**: `Promise<void>`

### doc.getElementsByClassName*(classNames)* <div class="specs"><i>W3C</i></div> {#getElementsByClassName}

Returns a list of elements with the given class name.

#### **Arguments**:


 - classNames `string`. <var>names</var> is a string representing the class name(s) to match; multiple class names are separated by whitespace

#### **Returns**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.getElementsByName*(elementName)* <div class="specs"><i>W3C</i></div> {#getElementsByName}

Returns a list of elements with the given name.

#### **Arguments**:


 - elementName `string`. <var>name</var> is the value of the <code>name</code> attribute of the element(s).

#### **Returns**: [`SuperNodeList`](/docs/awaited-dom/super-node-list)

### doc.getElementsByTagName*(qualifiedName)* <div class="specs"><i>W3C</i></div> {#getElementsByTagName}

Returns a list of elements with the given tag name.

#### **Arguments**:


 - qualifiedName `string`. <var>name</var> is a string representing the name of the elements. The special string "*" represents all elements.

#### **Returns**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.getElementsByTagNameNS*(namespace, localName)* <div class="specs"><i>W3C</i></div> {#getElementsByTagNameNS}

Returns a list of elements with the given tag name and namespace.

#### **Arguments**:


 - namespace `string`. <var>namespace</var> is the namespace URI of elements to look for (see <code>element.namespaceURI</code>).
 - localName `string`. <var>name</var> is either the local name of elements to look for or the special value <code>*</code>, which matches all elements (see <code>element.localName</code>).

#### **Returns**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### doc.hasFocus*()* <div class="specs"><i>W3C</i></div> {#hasFocus}

Returns <code>true</code> if the focus is currently located anywhere inside the specified document.

#### **Returns**: `Promise<boolean>`

### doc.compareDocumentPosition*(other)* <div class="specs"><i>W3C</i></div> {#compareDocumentPosition}

Compares the position of the current node against another node in any other document.

#### **Arguments**:


 - other [`Node`](/docs/awaited-dom/node). The other <code>Node</code> with which to compare the first *<code>node</code>*’s document position.

#### **Returns**: `Promise<number>`

### doc.contains*(other)* <div class="specs"><i>W3C</i></div> {#contains}

Returns a `boolean` value indicating whether or not a node is a descendant of the calling node.

#### **Arguments**:


 - other [`Node`](/docs/awaited-dom/node). Needs content.

#### **Returns**: `Promise<boolean>`

### doc.getRootNode*(options?)* <div class="specs"><i>W3C</i></div> {#getRootNode}

Returns the context object's root which optionally includes the shadow root if it is available.&nbsp;

#### **Arguments**:


 - options `GetRootNodeOptions`. An object that sets options for getting the root node. The available options are:
     <ul>
      <li><code>composed</code>: A `boolean` that indicates whether the shadow root should be returned (<code>false</code>, the default), or a root node beyond shadow root (<code>true</code>).</li>
     </ul>

#### **Returns**: [`SuperNode`](/docs/awaited-dom/super-node)

### doc.hasChildNodes*()* <div class="specs"><i>W3C</i></div> {#hasChildNodes}

Returns a `boolean` indicating whether or not the element has any child nodes.

#### **Returns**: `Promise<boolean>`

### doc.isDefaultNamespace*(namespace)* <div class="specs"><i>W3C</i></div> {#isDefaultNamespace}

Accepts a namespace URI as an argument and returns a&nbsp;`boolean`&nbsp;with a value of&nbsp;<code>true</code>&nbsp;if the namespace is the default namespace on the given node or&nbsp;<code>false</code>&nbsp;if not.

#### **Arguments**:


 - namespace `string`. <code>namespaceURI</code> is a string representing the namespace against which the element will be checked.

#### **Returns**: `Promise<boolean>`

### doc.isEqualNode*(otherNode)* <div class="specs"><i>W3C</i></div> {#isEqualNode}

Returns a `boolean` which indicates whether or not two nodes are of the same type and all their defining data points match.

#### **Arguments**:


 - otherNode [`Node`](/docs/awaited-dom/node). <code>otherNode</code>: The <code>Node</code> to compare equality with.

#### **Returns**: `Promise<boolean>`

### doc.isSameNode*(otherNode)* <div class="specs"><i>W3C</i></div> {#isSameNode}

Returns a `boolean` value indicating whether or not the two nodes are the same (that is, they reference the same object).

#### **Arguments**:


 - otherNode [`Node`](/docs/awaited-dom/node). <code><var>otherNode</var></code>&nbsp;The <code>Node</code> to test against.

#### **Returns**: `Promise<boolean>`

### doc.lookupNamespaceURI*(prefix)* <div class="specs"><i>W3C</i></div> {#lookupNamespaceURI}

Accepts a prefix and returns the namespace URI associated with it on the given node if found (and&nbsp;<code>null</code>&nbsp;if not). Supplying&nbsp;<code>null</code>&nbsp;for the prefix will return the default namespace.

#### **Arguments**:


 - prefix `string`. The prefix to look for. If this parameter is <code>null</code>, the method will return the default namespace URI, if any.

#### **Returns**: `Promise<string>`

### doc.lookupPrefix*(namespace)* <div class="specs"><i>W3C</i></div> {#lookupPrefix}

Returns a&nbsp;`string` containing the prefix for a given namespace URI, if present, and&nbsp;<code>null</code>&nbsp;if not. When multiple prefixes are possible, the result is implementation-dependent.

#### **Arguments**:


 - namespace `string`. Needs content.

#### **Returns**: `Promise<string>`

### doc.normalize*()* <div class="specs"><i>W3C</i></div> {#normalize}

Clean up all the text nodes under this element (merge adjacent, remove empty).

#### **Returns**: `Promise<void>`

### doc.caretPositionFromPoint*(x, y)* <div class="specs"><i>W3C</i></div> {#caretPositionFromPoint}

Returns a <code>CaretPosition</code> object containing the DOM node containing the caret, and caret's character offset within that node.

#### **Arguments**:


 - x `number`. The horizontal coordinate of a point.
 - y `number`. The vertical coordinate of a point.

#### **Returns**: [`CaretPosition`](/docs/awaited-dom/caret-position)

### doc.elementFromPoint*(x, y)* <div class="specs"><i>W3C</i></div> {#elementFromPoint}

Returns the topmost element at the specified coordinates.

#### **Arguments**:


 - x `number`. The horizontal coordinate of a point, relative to the left edge of the current viewport.
 - y `number`. The vertical coordinate of a point, relative to the top edge of the current viewport.

#### **Returns**: [`SuperElement`](/docs/awaited-dom/super-element)

### doc.getSelection*()* <div class="specs"><i>W3C</i></div> {#getSelection}

Returns a <code>Selection</code> object representing the range of text selected by the user, or the current position of the caret.

#### **Returns**: [`Selection`](/docs/awaited-dom/selection)

### doc.getElementById*(elementId)* <div class="specs"><i>W3C</i></div> {#getElementById}

Needs content.

#### **Arguments**:


 - elementId `string`. Needs content.

#### **Returns**: [`SuperElement`](/docs/awaited-dom/super-element)

### doc.querySelector*(selectors)* <div class="specs"><i>W3C</i></div> {#querySelector}

Returns the first <code>Element</code> with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - selectors `string`. A `string` containing one or more selectors to match against. This string must be a valid compound selector list supported by the browser; if it's not, a <code>SyntaxError</code> exception is thrown. See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors" target="mdnrel">Locating DOM elements using selectors</a> for more information about using selectors to identify elements. Multiple selectors may be specified by separating them using commas.

#### **Returns**: [`SuperElement`](/docs/awaited-dom/super-element)

### doc.querySelectorAll*(selectors)* <div class="specs"><i>W3C</i></div> {#querySelectorAll}

Returns a <code>NodeList</code> representing a list of elements with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - selectors `string`. A `string` containing one or more selectors to match against. This string must be a valid CSS selector string; if it's not, a <code>SyntaxError</code> exception is thrown. See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors" target="mdnrel">Locating DOM elements using selectors</a> for more information about using selectors to identify elements. Multiple selectors may be specified by separating them using commas.

#### **Returns**: [`SuperNodeList`](/docs/awaited-dom/super-node-list)

### doc.createExpression*(expression, resolver?)* <div class="specs"><i>W3C</i></div> {#createExpression}

Creates a parsed XPath expression with resolved namespaces.

#### **Arguments**:


 - expression `string`. A `string` representing representing the XPath expression to be created.
 - resolver [`XPathNSResolver`](/docs/awaited-dom/x-path-ns-resolver). Permits translation of all prefixes, including the <code>xml</code> namespace prefix, within the XPath expression into appropriate namespace URIs.

#### **Returns**: [`XPathExpression`](/docs/awaited-dom/x-path-expression)

### doc.evaluate*(expression, contextNode, resolver?, type?, result?)* <div class="specs"><i>W3C</i></div> {#evaluate}

Evaluates an XPath expression string and returns a result of the specified type if possible.

#### **Arguments**:


 - expression `string`. A `string` representing the XPath expression to be parsed and evaluated.
 - contextNode [`Node`](/docs/awaited-dom/node). A <code>Node</code> representing the context to use for evaluating the expression.
 - resolver [`XPathNSResolver`](/docs/awaited-dom/x-path-ns-resolver). Permits translation of all prefixes, including the <code>xml</code> namespace prefix, within the XPath expression into appropriate namespace URIs.
 - type `number`. Specifies the type of result to be returned by evaluating the expression. This must be one of the <code>XPathResult.Constants</code>.
 - result [`XPathResult`](/docs/awaited-dom/x-path-result). Allows to specify a result object which may be reused and returned by this method. If this is specified as <code>null</code> or the implementation does not reuse the specified result, a new result object will be returned.

#### **Returns**: [`XPathResult`](/docs/awaited-dom/x-path-result)

## Unimplemented Specs

#### Properties

|     |     |
| --- | --- |
| `defaultView` | `fonts` |
| `onfullscreenchange` | `onfullscreenerror` |
| `onpointerlockchange` | `onpointerlockerror` |
| `onreadystatechange` | `onvisibilitychange` |
| `oncopy` | `oncut` |
| `onpaste` | `fonts` |
| `onabort` | `onanimationend` |
| `onanimationiteration` | `onanimationstart` |
| `onauxclick` | `onblur` |
| `oncancel` | `oncanplay` |
| `oncanplaythrough` | `onchange` |
| `onclick` | `onclose` |
| `oncontextmenu` | `oncuechange` |
| `ondblclick` | `ondrag` |
| `ondragend` | `ondragenter` |
| `ondragleave` | `ondragover` |
| `ondragstart` | `ondrop` |
| `ondurationchange` | `onemptied` |
| `onended` | `onerror` |
| `onfocus` | `onformdata` |
| `ongotpointercapture` | `oninput` |
| `oninvalid` | `onkeydown` |
| `onkeypress` | `onkeyup` |
| `onload` | `onloadeddata` |
| `onloadedmetadata` | `onloadstart` |
| `onlostpointercapture` | `onmousedown` |
| `onmouseenter` | `onmouseleave` |
| `onmousemove` | `onmouseout` |
| `onmouseover` | `onmouseup` |
| `onpause` | `onplay` |
| `onplaying` | `onpointercancel` |
| `onpointerdown` | `onpointerenter` |
| `onpointerleave` | `onpointermove` |
| `onpointerout` | `onpointerover` |
| `onpointerup` | `onprogress` |
| `onratechange` | `onreset` |
| `onresize` | `onscroll` |
| `onseeked` | `onseeking` |
| `onselect` | `onselectionchange` |
| `onselectstart` | `onstalled` |
| `onsubmit` | `onsuspend` |
| `ontimeupdate` | `ontouchcancel` |
| `ontouchend` | `ontouchmove` |
| `ontouchstart` | `ontransitionend` |
| `onvolumechange` | `onwaiting` |
| `onwheel` |  |

#### Methods

|     |     |
| --- | --- |
| `adoptNode()` | `captureEvents()` |
| `close()` | `createAttribute()` |
| `createAttributeNS()` | `createCDATASection()` |
| `createComment()` | `createDocumentFragment()` |
| `createElement()` | `createElementNS()` |
| `createEvent()` | `createNodeIterator()` |
| `createProcessingInstruction()` | `createRange()` |
| `createTextNode()` | `createTreeWalker()` |
| `getSelection()` | `importNode()` |
| `open()` | `releaseEvents()` |
| `write()` | `writeln()` |
| `appendChild()` | `cloneNode()` |
| `insertBefore()` | `removeChild()` |
| `replaceChild()` | `addEventListener()` |
| `dispatchEvent()` | `removeEventListener()` |
| `elementsFromPoint()` | `append()` |
| `prepend()` | `createNSResolver()` |
