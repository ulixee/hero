# Node

<div class='overview'><span class="seoSummary"><strong><code>Node</code></strong> is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way.</span></div>

<div class='overview'>All of the following interfaces inherit the <code>Node</code> interface's methods and properties: <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a>, <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>, <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a>, <a href="/en-US/docs/Web/API/CharacterData" title="The CharacterData abstract interface represents a Node object that contains characters. This is an abstract interface, meaning there aren't any object of type CharacterData: it is implemented by other interfaces, like Text, Comment, or ProcessingInstruction which aren't abstract."><code>CharacterData</code></a> (which <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a>, <a href="/en-US/docs/Web/API/Comment" title="The Comment interface represents textual notations within markup; although it is generally not visually shown, such comments are available to be read in the source view."><code>Comment</code></a>, and <a href="/en-US/docs/Web/API/CDATASection" title="The CDATASection interface represents a CDATA section that can be used within XML to include extended portions of unescaped text. The symbols < and &amp; don’t need escaping as they normally do when inside a CDATA section."><code>CDATASection</code></a> inherit), <a href="/en-US/docs/Web/API/ProcessingInstruction" title="The ProcessingInstruction interface represents a processing instruction; that is, a Node which embeds an instruction targeting a specific application but that can be ignored by any other applications which don't recognize the instruction."><code>ProcessingInstruction</code></a>, <a href="/en-US/docs/Web/API/DocumentFragment" title="The DocumentFragment interface represents a minimal document object that has no parent. It is used as a lightweight version of Document that stores a segment of a document structure comprised of nodes just like a standard document."><code>DocumentFragment</code></a>, <a href="/en-US/docs/Web/API/DocumentType" title="The DocumentType interface represents a Node containing a doctype."><code>DocumentType</code></a>, <a href="/en-US/docs/Web/API/Notation" title="Represents a DTD notation (read-only). May declare format of an unparsed entity or formally declare the document's processing instruction targets. Inherits methods and properties from Node. Its nodeName is the notation name. Has no parent."><code>Notation</code></a>, <a class="new" href="/en-US/docs/Web/API/Entity" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>Entity</code></a>, <a class="new" href="/en-US/docs/Web/API/EntityReference" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>EntityReference</code></a></div>

<div class='overview'>Those interfaces may return <code>null</code> in certain cases where the methods and properties are not relevant. They may throw an exception — for example when adding children to a node type for which no children can exist.</div>

## Properties

### .baseURI <div class="specs"><i>W3C</i></div> {#baseURI}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the base URL of the document containing the <code>Node</code>.

#### **Type**: `SuperDocument`

### .childNodes <div class="specs"><i>W3C</i></div> {#childNodes}

Returns a live <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> containing all the children of this node. <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> being live means that if the children of the <code>Node</code> change, the <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> object is automatically updated.

#### **Type**: `SuperDocument`

### .firstChild <div class="specs"><i>W3C</i></div> {#firstChild}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the first direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: `SuperDocument`

### .isConnected <div class="specs"><i>W3C</i></div> {#isConnected}

A boolean indicating whether or not the Node is connected (directly or indirectly) to the context object, e.g. the <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> object in the case of the normal DOM, or the <a href="/en-US/docs/Web/API/ShadowRoot" title="The ShadowRoot interface of the Shadow DOM API is the root node of a DOM subtree that is rendered separately from a document's main DOM tree."><code>ShadowRoot</code></a> in the case of a shadow DOM.

#### **Type**: `SuperDocument`

### .lastChild <div class="specs"><i>W3C</i></div> {#lastChild}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the last direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: `SuperDocument`

### .nextSibling <div class="specs"><i>W3C</i></div> {#nextSibling}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the next node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: `SuperDocument`

### .nodeName <div class="specs"><i>W3C</i></div> {#nodeName}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the name of the <code>Node</code>. The structure of the name will differ with the node type. E.g. An <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> will contain the name of the corresponding tag, like <code>'audio'</code> for an <a href="/en-US/docs/Web/API/HTMLAudioElement" title="The HTMLAudioElement interface provides access to the properties of <audio> elements, as well as methods to manipulate them."><code>HTMLAudioElement</code></a>, a <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a> node will have the <code>'#text'</code> string, or a <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> node will have the <code>'#document'</code> string.

#### **Type**: `SuperDocument`

### .nodeType <div class="specs"><i>W3C</i></div> {#nodeType}

Returns an <code>unsigned short</code> representing the type of the node. Possible values are:
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
	

#### **Type**: `SuperDocument`

### .nodeValue <div class="specs"><i>W3C</i></div> {#nodeValue}

Returns / Sets the value of the current node.

#### **Type**: `SuperDocument`

### .ownerDocument <div class="specs"><i>W3C</i></div> {#ownerDocument}

Returns the <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> that this node belongs to. If the node is itself a document, returns <code>null</code>.

#### **Type**: `SuperDocument`

### .parentElement <div class="specs"><i>W3C</i></div> {#parentElement}

Returns an <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that is the parent of this node. If the node has no parent, or if that parent is not an <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>, this property returns <code>null</code>.

#### **Type**: `SuperDocument`

### .parentNode <div class="specs"><i>W3C</i></div> {#parentNode}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> that is the parent of this node. If there is no such node, like if this node is the top of the tree or if doesn't participate in a tree, this property returns <code>null</code>.

#### **Type**: `SuperDocument`

### .previousSibling <div class="specs"><i>W3C</i></div> {#previousSibling}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the previous node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: `SuperDocument`

### .textContent <div class="specs"><i>W3C</i></div> {#textContent}

Returns / Sets the textual content of an element and all its descendants.

#### **Type**: `SuperDocument`

## Methods

### .appendChild*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#appendChild}

Adds the specified <code><var>childNode</var></code> argument as the last child to the current node.<br>
	If the argument referenced an existing node on the DOM tree, the node will be detached from its current position and attached at the new position.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .cloneNode*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#cloneNode}

Clone a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a>, and optionally, all of its contents. By default, it clones the content of the node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .compareDocumentPosition*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#compareDocumentPosition}

Compares the position of the current node against another node in any other document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .contains*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#contains}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> value indicating whether or not a node is a descendant of the calling node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getRootNode*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getRootNode}

Returns the context object's root which optionally includes the shadow root if it is available.&nbsp;

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .hasChildNodes*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#hasChildNodes}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> indicating whether or not the element has any child nodes.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .insertBefore*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#insertBefore}

Inserts a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a>&nbsp;before the reference node as a child of a specified parent node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .isDefaultNamespace*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#isDefaultNamespace}

Accepts a namespace URI as an argument and returns a&nbsp;<a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>&nbsp;with a value of&nbsp;<code>true</code>&nbsp;if the namespace is the default namespace on the given node or&nbsp;<code>false</code>&nbsp;if not.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .isEqualNode*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#isEqualNode}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> which indicates whether or not two nodes are of the same type and all their defining data points match.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .isSameNode*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#isSameNode}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> value indicating whether or not the two nodes are the same (that is, they reference the same object).

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .lookupNamespaceURI*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#lookupNamespaceURI}

Accepts a prefix and returns the namespace URI associated with it on the given node if found (and&nbsp;<code>null</code>&nbsp;if not). Supplying&nbsp;<code>null</code>&nbsp;for the prefix will return the default namespace.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .lookupPrefix*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#lookupPrefix}

Returns a&nbsp;<a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the prefix for a given namespace URI, if present, and&nbsp;<code>null</code>&nbsp;if not. When multiple prefixes are possible, the result is implementation-dependent.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .normalize*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#normalize}

Clean up all the text nodes under this element (merge adjacent, remove empty).

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .removeChild*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#removeChild}

Removes a child node from the current element, which must be a child of the current node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .replaceChild*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#replaceChild}

Replaces one child <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> of the current one with the second one given in parameter.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
