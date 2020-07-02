# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> XMLDocument

<div class='overview'>The <strong>XMLDocument</strong> interface represents an XML document. It inherits from the generic <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> and does not add any specific methods or properties to it: nevertheless, several algorithms behave differently with the two types of documents.</div>

## Properties

### doc.anchors <div class="specs"><i>W3C</i></div> {#anchors}

Returns a list of all of the anchors in the document.

#### **Type**: `SuperHTMLCollection`

### doc.body <div class="specs"><i>W3C</i></div> {#body}

Returns the <a href="/en-US/docs/Web/HTML/Element/body" title="The HTML <body> Element represents the content of an HTML&nbsp;document. There can be only one <body> element in a document."><code>&lt;body&gt;</code></a> or <a href="/en-US/docs/Web/HTML/Element/frameset" title="The HTML <frameset> element is used to contain <frame> elements."><code>&lt;frameset&gt;</code>
</a> node of the current document.

#### **Type**: `SuperHTMLElement`

### doc.characterSet <div class="specs"><i>W3C</i></div> {#characterSet}

Returns the character set being used by the document.

#### **Type**: `string`

### doc.compatMode <div class="specs"><i>W3C</i></div> {#compatMode}

Indicates whether the document is rendered in <em>quirks</em> or <em>strict
</em> mode.

#### **Type**: `string`

### doc.contentType <div class="specs"><i>W3C</i></div> {#contentType}

Returns the Content-Type from the MIME Header of the current document.

#### **Type**: `string`

### doc.cookie <div class="specs"><i>W3C</i></div> {#cookie}

Returns a semicolon-separated list of the cookies for that document or sets a single cookie.

#### **Type**: `string`

### doc.designMode <div class="specs"><i>W3C</i></div> {#designMode}

Gets/sets the ability to edit the whole document.

#### **Type**: `string`

### doc.dir <div class="specs"><i>W3C</i></div> {#dir}

Gets/sets directionality (rtl/ltr) of the document.

#### **Type**: `string`

### doc.doctype <div class="specs"><i>W3C</i></div> {#doctype}

Returns the Document Type Definition (DTD) of the current document.

#### **Type**: `DocumentType`

### doc.documentElement <div class="specs"><i>W3C</i></div> {#documentElement}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that is a direct child of the document. For HTML documents, this is normally the <a href="/en-US/docs/Web/API/HTMLHtmlElement" title="The HTMLHtmlElement interface serves as the root node for a given HTML document. This object inherits the properties and methods described in the HTMLElement interface."><code>HTMLHtmlElement</code></a> object representing the document's <a href="/en-US/docs/Web/HTML/Element/html" title="The HTML <html> element represents the root (top-level element) of an HTML document, so it is also referred to as the root element. All other elements must be descendants of this element."><code>&lt;html&gt;</code>
</a> element.

#### **Type**: `SuperElement`

### doc.documentURI <div class="specs"><i>W3C</i></div> {#documentURI}

Returns the document location as a string.

#### **Type**: `string`

### doc.domain <div class="specs"><i>W3C</i></div> {#domain}

Gets/sets the domain of the current document.

#### **Type**: `string`

### doc.embeds <div class="specs"><i>W3C</i></div> {#embeds}

Returns a list of the embedded <a href="/en-US/docs/Web/HTML/Element/embed" title="The HTML <embed> element embeds external content at the specified point in the document. This content is provided by an external application or other source of interactive content such as a browser plug-in."><code>&lt;embed&gt;</code>
</a> elements within the current document.

#### **Type**: `SuperHTMLCollection`

### doc.featurePolicy <div class="specs"><i>W3C</i></div> {#featurePolicy}

Returns the <a href="/en-US/docs/Web/API/FeaturePolicy" title="The FeaturePolicy&nbsp;interface of the Feature Policy API represents the set of policies applied to the current execution context."><code>FeaturePolicy</code>
</a> interface which provides a simple API for introspecting the feature policies applied to a specific document.

#### **Type**: `FeaturePolicy`

### doc.forms <div class="specs"><i>W3C</i></div> {#forms}

Returns a list of the <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code>
</a> elements within the current document.

#### **Type**: `SuperHTMLCollection`

### doc.fullscreenEnabled <div class="specs"><i>W3C</i></div> {#fullscreenEnabled}

Indicates whether or not full-screen mode is available.

#### **Type**: `boolean`

### doc.head <div class="specs"><i>W3C</i></div> {#head}

Returns the <a href="/en-US/docs/Web/HTML/Element/head" title="The HTML <head> element contains machine-readable information (metadata) about the document, like its title, scripts, and style sheets."><code>&lt;head&gt;</code>
</a> element of the current document.

#### **Type**: `HTMLHeadElement`

### doc.hidden <div class="specs"><i>W3C</i></div> {#hidden}

Returns a Boolean value indicating if the page is considered hidden or not.

#### **Type**: `boolean`

### doc.images <div class="specs"><i>W3C</i></div> {#images}

Returns a list of the images in the current document.

#### **Type**: `SuperHTMLCollection`

### doc.implementation <div class="specs"><i>W3C</i></div> {#implementation}

Returns the DOM implementation associated with the current document.

#### **Type**: `DOMImplementation`

### doc.lastModified <div class="specs"><i>W3C</i></div> {#lastModified}

Returns the date on which the document was last modified.

#### **Type**: `string`

### doc.links <div class="specs"><i>W3C</i></div> {#links}

Returns a list of all the hyperlinks in the document.

#### **Type**: `SuperHTMLCollection`

### doc.location <div class="specs"><i>W3C</i></div> {#location}

Returns the URI of the current document.

#### **Type**: `Location`

### doc.plugins <div class="specs"><i>W3C</i></div> {#plugins}

Returns a list of the available plugins.

#### **Type**: `SuperHTMLCollection`

### doc.readyState <div class="specs"><i>W3C</i></div> {#readyState}

Returns loading status of the document.

#### **Type**: `DocumentReadyState`

### doc.referrer <div class="specs"><i>W3C</i></div> {#referrer}

Returns the URI of the page that linked to this page.

#### **Type**: `string`

### doc.scripts <div class="specs"><i>W3C</i></div> {#scripts}

Returns all the <a href="/en-US/docs/Web/HTML/Element/script" title="The HTML <script> element is used to embed or reference executable code; this is typically used to embed or refer to JavaScript code."><code>&lt;script&gt;</code>
</a> elements on the document.

#### **Type**: `SuperHTMLCollection`

### doc.scrollingElement <div class="specs"><i>W3C</i></div> {#scrollingElement}

Returns a reference to the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> that scrolls the document.

#### **Type**: `SuperElement`

### doc.title <div class="specs"><i>W3C</i></div> {#title}

Sets or gets the title of the current document.

#### **Type**: `string`

### doc.URL <div class="specs"><i>W3C</i></div> {#URL}

Returns the document location as a string.

#### **Type**: `string`

### doc.visibilityState <div class="specs"><i>W3C</i></div> {#visibilityState}

Returns a <code>string</code> denoting the visibility state of the document. Possible values are <code>visible</code>, <code>hidden</code>, <code>prerender</code>, and <code>unloaded
</code>.

#### **Type**: `VisibilityState`

### doc.baseURI <div class="specs"><i>W3C</i></div> {#baseURI}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the base URL of the document containing the <code>Node
</code>.

#### **Type**: `string`

### doc.childNodes <div class="specs"><i>W3C</i></div> {#childNodes}

Returns a live <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> containing all the children of this node. <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> being live means that if the children of the <code>Node</code> change, the <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code>
</a> object is automatically updated.

#### **Type**: `SuperNodeList`

### doc.firstChild <div class="specs"><i>W3C</i></div> {#firstChild}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the first direct child node of the node, or <code>null
</code> if the node has no child.

#### **Type**: `SuperNode`

### doc.isConnected <div class="specs"><i>W3C</i></div> {#isConnected}

A boolean indicating whether or not the Node is connected (directly or indirectly) to the context object, e.g. the <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> object in the case of the normal DOM, or the <a href="/en-US/docs/Web/API/ShadowRoot" title="The ShadowRoot interface of the Shadow DOM API is the root node of a DOM subtree that is rendered separately from a document's main DOM tree."><code>ShadowRoot</code>
</a> in the case of a shadow DOM.

#### **Type**: `boolean`

### doc.lastChild <div class="specs"><i>W3C</i></div> {#lastChild}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the last direct child node of the node, or <code>null
</code> if the node has no child.

#### **Type**: `SuperNode`

### doc.nextSibling <div class="specs"><i>W3C</i></div> {#nextSibling}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the next node in the tree, or <code>null
</code> if there isn't such node.

#### **Type**: `SuperNode`

### doc.nodeName <div class="specs"><i>W3C</i></div> {#nodeName}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the name of the <code>Node</code>. The structure of the name will differ with the node type. E.g. An <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> will contain the name of the corresponding tag, like <code>'audio'</code> for an <a href="/en-US/docs/Web/API/HTMLAudioElement" title="The HTMLAudioElement interface provides access to the properties of <audio> elements, as well as methods to manipulate them."><code>HTMLAudioElement</code></a>, a <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a> node will have the <code>'#text'</code> string, or a <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> node will have the <code>'#document'
</code> string.

#### **Type**: `string`

### doc.nodeType <div class="specs"><i>W3C</i></div> {#nodeType}

Returns an <code>unsigned short
</code> representing the type of the node. Possible values are:
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
	

#### **Type**: `number`

### doc.nodeValue <div class="specs"><i>W3C</i></div> {#nodeValue}

Returns / Sets the value of the current node.

#### **Type**: `string`

### doc.ownerDocument <div class="specs"><i>W3C</i></div> {#ownerDocument}

Returns the <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> that this node belongs to. If the node is itself a document, returns <code>null
</code>.

#### **Type**: `SuperDocument`

### doc.parentElement <div class="specs"><i>W3C</i></div> {#parentElement}

Returns an <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that is the parent of this node. If the node has no parent, or if that parent is not an <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>, this property returns <code>null
</code>.

#### **Type**: `SuperElement`

### doc.parentNode <div class="specs"><i>W3C</i></div> {#parentNode}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> that is the parent of this node. If there is no such node, like if this node is the top of the tree or if doesn't participate in a tree, this property returns <code>null
</code>.

#### **Type**: `SuperNode`

### doc.previousSibling <div class="specs"><i>W3C</i></div> {#previousSibling}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the previous node in the tree, or <code>null
</code> if there isn't such node.

#### **Type**: `SuperNode`

### doc.textContent <div class="specs"><i>W3C</i></div> {#textContent}

Returns / Sets the textual content of an element and all its descendants.

#### **Type**: `string`

### doc.childElementCount <div class="specs"><i>W3C</i></div> {#childElementCount}

Returns the number of children of this <code>ParentNode
</code> which are elements.

#### **Type**: `number`

### doc.children <div class="specs"><i>W3C</i></div> {#children}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> containing all of the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> objects that are children of this <code>ParentNode
</code>, omitting all of its non-element nodes.

#### **Type**: `SuperHTMLCollection`

### doc.firstElementChild <div class="specs"><i>W3C</i></div> {#firstElementChild}

Returns the first node which is both a child of this <code>ParentNode</code> <em>and</em> is also an <code>Element</code>, or <code>null
</code> if there is none.

#### **Type**: `SuperElement`

### doc.lastElementChild <div class="specs"><i>W3C</i></div> {#lastElementChild}

Returns the last node which is both a child of this <code>ParentNode</code> <em>and</em> is an <code>Element</code>, or <code>null
</code> if there is none.

#### **Type**: `SuperElement`

## Methods

### doc.exitFullscreen*(...args)* <div class="specs"><i>W3C</i></div> {#exitFullscreen}

Requests that the element on this document which is currently being presented in full-screen mode be taken out of full-screen mode, restoring the previous state of the screen.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.exitPointerLock*(...args)* <div class="specs"><i>W3C</i></div> {#exitPointerLock}

Release the pointer lock.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.getElementsByClassName*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByClassName}

Returns a list of elements with the given class name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.getElementsByName*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByName}

Returns a list of elements with the given name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.getElementsByTagName*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByTagName}

Returns a list of elements with the given tag name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.getElementsByTagNameNS*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByTagNameNS}

Returns a list of elements with the given tag name and namespace.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.hasFocus*(...args)* <div class="specs"><i>W3C</i></div> {#hasFocus}

Returns <code>true
</code> if the focus is currently located anywhere inside the specified document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.compareDocumentPosition*(...args)* <div class="specs"><i>W3C</i></div> {#compareDocumentPosition}

Compares the position of the current node against another node in any other document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.contains*(...args)* <div class="specs"><i>W3C</i></div> {#contains}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> value indicating whether or not a node is a descendant of the calling node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.getRootNode*(...args)* <div class="specs"><i>W3C</i></div> {#getRootNode}

Returns the context object's root which optionally includes the shadow root if it is available.&nbsp;

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.hasChildNodes*(...args)* <div class="specs"><i>W3C</i></div> {#hasChildNodes}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating whether or not the element has any child nodes.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.isDefaultNamespace*(...args)* <div class="specs"><i>W3C</i></div> {#isDefaultNamespace}

Accepts a namespace URI as an argument and returns a&nbsp;<a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>&nbsp;with a value of&nbsp;<code>true</code>&nbsp;if the namespace is the default namespace on the given node or&nbsp;<code>false
</code>&nbsp;if not.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.isEqualNode*(...args)* <div class="specs"><i>W3C</i></div> {#isEqualNode}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> which indicates whether or not two nodes are of the same type and all their defining data points match.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.isSameNode*(...args)* <div class="specs"><i>W3C</i></div> {#isSameNode}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> value indicating whether or not the two nodes are the same (that is, they reference the same object).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.lookupNamespaceURI*(...args)* <div class="specs"><i>W3C</i></div> {#lookupNamespaceURI}

Accepts a prefix and returns the namespace URI associated with it on the given node if found (and&nbsp;<code>null</code>&nbsp;if not). Supplying&nbsp;<code>null
</code>&nbsp;for the prefix will return the default namespace.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.lookupPrefix*(...args)* <div class="specs"><i>W3C</i></div> {#lookupPrefix}

Returns a&nbsp;<a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the prefix for a given namespace URI, if present, and&nbsp;<code>null
</code>&nbsp;if not. When multiple prefixes are possible, the result is implementation-dependent.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.normalize*(...args)* <div class="specs"><i>W3C</i></div> {#normalize}

Clean up all the text nodes under this element (merge adjacent, remove empty).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.querySelector*(...args)* <div class="specs"><i>W3C</i></div> {#querySelector}

Returns the first <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### doc.querySelectorAll*(...args)* <div class="specs"><i>W3C</i></div> {#querySelectorAll}

Returns a <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code>
</a> representing a list of elements with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

## Unimplemented Specs


This class has 94 unimplemented properties and 40 unimplemented methods.
