# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLScriptElement

<div class='overview'><span class="seoSummary">HTML <a href="/en-US/docs/Web/HTML/Element/script" title="The HTML <script> element is used to embed or reference executable code; this is typically used to embed or refer to JavaScript code."><code>&lt;script&gt;</code></a> elements expose the <strong><code>HTMLScriptElement</code></strong> interface, which provides special properties and methods for manipulating the behavior and execution of <code>&lt;script&gt;</code> elements (beyond the inherited <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface).</span></div>

<div class='overview'>JavaScript files should be served with the <code>application/javascript</code> <a href="/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types">MIME type</a>, but browsers are lenient and block them only if the script is served with an image type (<code>image/*</code>), video type (<code>video/*</code>), audio type (<code>audio/*</code>), or <code>text/csv</code>. If the script is blocked, its element receives an <code><a href="/en-US/docs/Web/Events/error" title="/en-US/docs/Web/Events/error">error</a></code> event; otherwise, it receives a <code><a href="/en-US/docs/Web/Events/load" title="/en-US/docs/Web/Events/load">load</a></code> event.</div>

## Properties

### elem.accessKey <div class="specs"><i>W3C</i></div> {#accessKey}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the access key assigned to the element.

#### **Type**: `string`

### elem.autoCapitalize <div class="specs"><i>W3C</i></div> {#autoCapitalize}

Needs content.

#### **Type**: `string`

### elem.dir <div class="specs"><i>W3C</i></div> {#dir}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a>, reflecting the <code>dir</code> global attribute, representing the directionality of the element. Possible values are <code>"ltr"</code>, <code>"rtl"</code>, and <code>"auto"
</code>.

#### **Type**: `string`

### elem.draggable <div class="specs"><i>W3C</i></div> {#draggable}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element can be dragged.

#### **Type**: `boolean`

### elem.hidden <div class="specs"><i>W3C</i></div> {#hidden}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element is hidden or not.

#### **Type**: `boolean`

### elem.inert <div class="specs"><i>W3C</i></div> {#inert}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating whether the user agent must act as though the given node is absent for the purposes of user interaction events, in-page text searches ("find in page"), and text selection.

#### **Type**: `boolean`

### elem.innerText <div class="specs"><i>W3C</i></div> {#innerText}

Represents the "rendered" text content of a node and its descendants. As a getter, it approximates the text the user would get if they highlighted the contents of the element with the cursor and then copied it to the clipboard.

#### **Type**: `string`

### elem.lang <div class="specs"><i>W3C</i></div> {#lang}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the language of an element's attributes, text, and element contents.

#### **Type**: `string`

### elem.offsetHeight <div class="specs"><i>W3C</i></div> {#offsetHeight}

Returns a <code>double
</code> containing the height of an element, relative to the layout.

#### **Type**: `number`

### elem.offsetLeft <div class="specs"><i>W3C</i></div> {#offsetLeft}

Returns a <code>double</code>, the distance from this element's left border to its <code>offsetParent
</code>'s left border.

#### **Type**: `number`

### elem.offsetParent <div class="specs"><i>W3C</i></div> {#offsetParent}

Returns a <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> that is the element from which all offset calculations are currently computed.

#### **Type**: `SuperElement`

### elem.offsetTop <div class="specs"><i>W3C</i></div> {#offsetTop}

Returns a <code>double</code>, the distance from this element's top border to its <code>offsetParent
</code>'s top border.

#### **Type**: `number`

### elem.offsetWidth <div class="specs"><i>W3C</i></div> {#offsetWidth}

Returns a <code>double
</code> containing the width of an element, relative to the layout.

#### **Type**: `number`

### elem.spellcheck <div class="specs"><i>W3C</i></div> {#spellcheck}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that controls <a href="/en-US/docs/HTML/Controlling_spell_checking_in_HTML_forms" title="en/Controlling_spell_checking_in_HTML_forms">spell-checking
</a>. It is present on all HTML elements, though it doesn't have an effect on all of them.

#### **Type**: `boolean`

### elem.title <div class="specs"><i>W3C</i></div> {#title}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> containing the text that appears in a popup box when mouse is over the element.

#### **Type**: `string`

### elem.translate <div class="specs"><i>W3C</i></div> {#translate}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> representing the translation.

#### **Type**: `boolean`

### elem.attributes <div class="specs"><i>W3C</i></div> {#attributes}

Returns a <a href="/en-US/docs/Web/API/NamedNodeMap" title="The NamedNodeMap interface represents a collection of Attr objects. Objects inside a NamedNodeMap are not in any particular order, unlike NodeList, although they may be accessed by an index as in an array."><code>NamedNodeMap</code>
</a> object containing the assigned attributes of the corresponding HTML element.

#### **Type**: `NamedNodeMap`

### elem.classList <div class="specs"><i>W3C</i></div> {#classList}

Returns a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code>
</a> containing the list of class attributes.

#### **Type**: `DOMTokenList`

### elem.className <div class="specs"><i>W3C</i></div> {#className}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the class of the element.

#### **Type**: `string`

### elem.clientHeight <div class="specs"><i>W3C</i></div> {#clientHeight}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the inner height of the element.

#### **Type**: `number`

### elem.clientLeft <div class="specs"><i>W3C</i></div> {#clientLeft}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the width of the left border of the element.

#### **Type**: `number`

### elem.clientTop <div class="specs"><i>W3C</i></div> {#clientTop}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the width of the top border of the element.

#### **Type**: `number`

### elem.clientWidth <div class="specs"><i>W3C</i></div> {#clientWidth}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the inner width of the element.

#### **Type**: `number`

### elem.id <div class="specs"><i>W3C</i></div> {#id}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the id of the element.

#### **Type**: `string`

### elem.innerHTML <div class="specs"><i>W3C</i></div> {#innerHTML}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the markup of the element's content.

#### **Type**: `string`

### elem.localName <div class="specs"><i>W3C</i></div> {#localName}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the local part of the qualified name of the element.

#### **Type**: `string`

### elem.namespaceURI <div class="specs"><i>W3C</i></div> {#namespaceURI}

The namespace URI of the element, or <code>null
</code> if it is no namespace.
 <div class="note">
 <p><strong>Note:</strong> In Firefox 3.5 and earlier, HTML elements are in no namespace. In later versions, HTML elements are in the <code><a class="external linkification-ext" href="http://www.w3.org/1999/xhtml" rel="noopener" title="Linkification: http://www.w3.org/1999/xhtml">http://www.w3.org/1999/xhtml</a></code> namespace in both HTML and XML trees. </p>
 </div>
 

#### **Type**: `string`

### elem.outerHTML <div class="specs"><i>W3C</i></div> {#outerHTML}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the markup of the element including its content. When used as a setter, replaces the element with nodes parsed from the given string.

#### **Type**: `string`

### elem.part <div class="specs"><i>W3C</i></div> {#part}

Represents the part identifier(s) of the element (i.e. set using the <code>part</code> attribute), returned as a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code>
</a>.

#### **Type**: `DOMTokenList`

### elem.prefix <div class="specs"><i>W3C</i></div> {#prefix}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the namespace prefix of the element, or <code>null
</code> if no prefix is specified.

#### **Type**: `string`

### elem.scrollHeight <div class="specs"><i>W3C</i></div> {#scrollHeight}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the scroll view height of an element.

#### **Type**: `number`

### elem.scrollLeft <div class="specs"><i>W3C</i></div> {#scrollLeft}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the left scroll offset of the element.

#### **Type**: `number`

### elem.scrollTop <div class="specs"><i>W3C</i></div> {#scrollTop}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing number of pixels the top of the document is scrolled vertically.

#### **Type**: `number`

### elem.scrollWidth <div class="specs"><i>W3C</i></div> {#scrollWidth}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the scroll view width of the element.

#### **Type**: `number`

### elem.shadowRoot <div class="specs"><i>W3C</i></div> {#shadowRoot}

Returns the open shadow root that is hosted by the element, or null if no open shadow root is present.

#### **Type**: `ShadowRoot`

### elem.slot <div class="specs"><i>W3C</i></div> {#slot}

Returns the name of the shadow DOM slot the element is inserted in.

#### **Type**: `string`

### elem.tagName <div class="specs"><i>W3C</i></div> {#tagName}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/String" title="The String global object is a constructor for strings or a sequence of characters."><code>String</code>
</a> with the name of the tag for the given element.

#### **Type**: `string`

### elem.baseURI <div class="specs"><i>W3C</i></div> {#baseURI}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the base URL of the document containing the <code>Node
</code>.

#### **Type**: `string`

### elem.childNodes <div class="specs"><i>W3C</i></div> {#childNodes}

Returns a live <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> containing all the children of this node. <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> being live means that if the children of the <code>Node</code> change, the <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code>
</a> object is automatically updated.

#### **Type**: `SuperNodeList`

### elem.firstChild <div class="specs"><i>W3C</i></div> {#firstChild}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the first direct child node of the node, or <code>null
</code> if the node has no child.

#### **Type**: `SuperNode`

### elem.isConnected <div class="specs"><i>W3C</i></div> {#isConnected}

A boolean indicating whether or not the Node is connected (directly or indirectly) to the context object, e.g. the <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> object in the case of the normal DOM, or the <a href="/en-US/docs/Web/API/ShadowRoot" title="The ShadowRoot interface of the Shadow DOM API is the root node of a DOM subtree that is rendered separately from a document's main DOM tree."><code>ShadowRoot</code>
</a> in the case of a shadow DOM.

#### **Type**: `boolean`

### elem.lastChild <div class="specs"><i>W3C</i></div> {#lastChild}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the last direct child node of the node, or <code>null
</code> if the node has no child.

#### **Type**: `SuperNode`

### elem.nextSibling <div class="specs"><i>W3C</i></div> {#nextSibling}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the next node in the tree, or <code>null
</code> if there isn't such node.

#### **Type**: `SuperNode`

### elem.nodeName <div class="specs"><i>W3C</i></div> {#nodeName}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the name of the <code>Node</code>. The structure of the name will differ with the node type. E.g. An <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> will contain the name of the corresponding tag, like <code>'audio'</code> for an <a href="/en-US/docs/Web/API/HTMLAudioElement" title="The HTMLAudioElement interface provides access to the properties of <audio> elements, as well as methods to manipulate them."><code>HTMLAudioElement</code></a>, a <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a> node will have the <code>'#text'</code> string, or a <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> node will have the <code>'#document'
</code> string.

#### **Type**: `string`

### elem.nodeType <div class="specs"><i>W3C</i></div> {#nodeType}

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

### elem.nodeValue <div class="specs"><i>W3C</i></div> {#nodeValue}

Returns / Sets the value of the current node.

#### **Type**: `string`

### elem.ownerDocument <div class="specs"><i>W3C</i></div> {#ownerDocument}

Returns the <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> that this node belongs to. If the node is itself a document, returns <code>null
</code>.

#### **Type**: `SuperDocument`

### elem.parentElement <div class="specs"><i>W3C</i></div> {#parentElement}

Returns an <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that is the parent of this node. If the node has no parent, or if that parent is not an <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>, this property returns <code>null
</code>.

#### **Type**: `SuperElement`

### elem.parentNode <div class="specs"><i>W3C</i></div> {#parentNode}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> that is the parent of this node. If there is no such node, like if this node is the top of the tree or if doesn't participate in a tree, this property returns <code>null
</code>.

#### **Type**: `SuperNode`

### elem.previousSibling <div class="specs"><i>W3C</i></div> {#previousSibling}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the previous node in the tree, or <code>null
</code> if there isn't such node.

#### **Type**: `SuperNode`

### elem.textContent <div class="specs"><i>W3C</i></div> {#textContent}

Returns / Sets the textual content of an element and all its descendants.

#### **Type**: `string`

### elem.nextElementSibling <div class="specs"><i>W3C</i></div> {#nextElementSibling}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> immediately following this node in its parent's children list, or <code>null</code> if there is no <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> in the list following this node.

#### **Type**: `SuperElement`

### elem.previousElementSibling <div class="specs"><i>W3C</i></div> {#previousElementSibling}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> immediately prior to this node in its parent's children list, or <code>null</code> if there is no <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> in the list prior to this node.

#### **Type**: `SuperElement`

### elem.childElementCount <div class="specs"><i>W3C</i></div> {#childElementCount}

Returns the number of children of this <code>ParentNode
</code> which are elements.

#### **Type**: `number`

### elem.children <div class="specs"><i>W3C</i></div> {#children}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> containing all of the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> objects that are children of this <code>ParentNode
</code>, omitting all of its non-element nodes.

#### **Type**: `SuperHTMLCollection`

### elem.firstElementChild <div class="specs"><i>W3C</i></div> {#firstElementChild}

Returns the first node which is both a child of this <code>ParentNode</code> <em>and</em> is also an <code>Element</code>, or <code>null
</code> if there is none.

#### **Type**: `SuperElement`

### elem.lastElementChild <div class="specs"><i>W3C</i></div> {#lastElementChild}

Returns the last node which is both a child of this <code>ParentNode</code> <em>and</em> is an <code>Element</code>, or <code>null
</code> if there is none.

#### **Type**: `SuperElement`

## Methods

### elem.click*(...args)* <div class="specs"><i>W3C</i></div> {#click}

Sends a mouse click event to the element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.closest*(...args)* <div class="specs"><i>W3C</i></div> {#closest}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> which is the closest ancestor of the current element (or the current element itself) which matches the selectors given in parameter.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getAttribute*(...args)* <div class="specs"><i>W3C</i></div> {#getAttribute}

Retrieves the value of the named attribute from the current node and returns it as an <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object" title="The Object class represents one of JavaScript's data types. It is used to store&nbsp;various keyed collections and more complex entities. Objects can be created using the Object() constructor or the object initializer / literal syntax."><code>Object</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getAttributeNames*(...args)* <div class="specs"><i>W3C</i></div> {#getAttributeNames}

Returns an array of attribute names from the current element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getAttributeNode*(...args)* <div class="specs"><i>W3C</i></div> {#getAttributeNode}

Retrieves the node representation of the named attribute from the current node and returns it as an <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getAttributeNodeNS*(...args)* <div class="specs"><i>W3C</i></div> {#getAttributeNodeNS}

Retrieves the node representation of the attribute with the specified name and namespace, from the current node and returns it as an <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getAttributeNS*(...args)* <div class="specs"><i>W3C</i></div> {#getAttributeNS}

Retrieves the value of the attribute with the specified name and namespace, from the current node and returns it as an <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object" title="The Object class represents one of JavaScript's data types. It is used to store&nbsp;various keyed collections and more complex entities. Objects can be created using the Object() constructor or the object initializer / literal syntax."><code>Object</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getBoundingClientRect*(...args)* <div class="specs"><i>W3C</i></div> {#getBoundingClientRect}

Returns the size of an element and its position relative to the viewport.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getClientRects*(...args)* <div class="specs"><i>W3C</i></div> {#getClientRects}

Returns a collection of rectangles that indicate the bounding rectangles for each line of text in a client.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getElementsByClassName*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByClassName}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code>
</a> that contains all descendants of the current element that possess the list of classes given in the parameter.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getElementsByTagName*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByTagName}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code>
</a> containing all descendant elements, of a particular tag name, from the current element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getElementsByTagNameNS*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByTagNameNS}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code>
</a> containing all descendant elements, of a particular tag name and namespace, from the current element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.hasAttribute*(...args)* <div class="specs"><i>W3C</i></div> {#hasAttribute}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element has the specified attribute or not.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.hasAttributeNS*(...args)* <div class="specs"><i>W3C</i></div> {#hasAttributeNS}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element has the specified attribute, in the specified namespace, or not.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.hasAttributes*(...args)* <div class="specs"><i>W3C</i></div> {#hasAttributes}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element has one or more HTML attributes present.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.hasPointerCapture*(...args)* <div class="specs"><i>W3C</i></div> {#hasPointerCapture}

Indicates whether the element on which it is invoked has pointer capture for the pointer identified by the given pointer ID.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.matches*(...args)* <div class="specs"><i>W3C</i></div> {#matches}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating whether or not the element would be selected by the specified selector string.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.requestFullscreen*(...args)* <div class="specs"><i>W3C</i></div> {#requestFullscreen}

Asynchronously asks the browser to make the element full-screen.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.requestPointerLock*(...args)* <div class="specs"><i>W3C</i></div> {#requestPointerLock}

Allows to asynchronously ask for the pointer to be locked on the given element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.scrollIntoView*(...args)* <div class="specs"><i>W3C</i></div> {#scrollIntoView}

Scrolls the page until the element gets into the view.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.compareDocumentPosition*(...args)* <div class="specs"><i>W3C</i></div> {#compareDocumentPosition}

Compares the position of the current node against another node in any other document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.contains*(...args)* <div class="specs"><i>W3C</i></div> {#contains}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> value indicating whether or not a node is a descendant of the calling node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getRootNode*(...args)* <div class="specs"><i>W3C</i></div> {#getRootNode}

Returns the context object's root which optionally includes the shadow root if it is available.&nbsp;

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.hasChildNodes*(...args)* <div class="specs"><i>W3C</i></div> {#hasChildNodes}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating whether or not the element has any child nodes.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.isDefaultNamespace*(...args)* <div class="specs"><i>W3C</i></div> {#isDefaultNamespace}

Accepts a namespace URI as an argument and returns a&nbsp;<a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>&nbsp;with a value of&nbsp;<code>true</code>&nbsp;if the namespace is the default namespace on the given node or&nbsp;<code>false
</code>&nbsp;if not.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.isEqualNode*(...args)* <div class="specs"><i>W3C</i></div> {#isEqualNode}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> which indicates whether or not two nodes are of the same type and all their defining data points match.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.isSameNode*(...args)* <div class="specs"><i>W3C</i></div> {#isSameNode}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> value indicating whether or not the two nodes are the same (that is, they reference the same object).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.lookupNamespaceURI*(...args)* <div class="specs"><i>W3C</i></div> {#lookupNamespaceURI}

Accepts a prefix and returns the namespace URI associated with it on the given node if found (and&nbsp;<code>null</code>&nbsp;if not). Supplying&nbsp;<code>null
</code>&nbsp;for the prefix will return the default namespace.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.lookupPrefix*(...args)* <div class="specs"><i>W3C</i></div> {#lookupPrefix}

Returns a&nbsp;<a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the prefix for a given namespace URI, if present, and&nbsp;<code>null
</code>&nbsp;if not. When multiple prefixes are possible, the result is implementation-dependent.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.normalize*(...args)* <div class="specs"><i>W3C</i></div> {#normalize}

Clean up all the text nodes under this element (merge adjacent, remove empty).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.blur*(...args)* <div class="specs"><i>W3C</i></div> {#blur}

Needs content.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.focus*(...args)* <div class="specs"><i>W3C</i></div> {#focus}

Needs content.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.querySelector*(...args)* <div class="specs"><i>W3C</i></div> {#querySelector}

Returns the first <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.querySelectorAll*(...args)* <div class="specs"><i>W3C</i></div> {#querySelectorAll}

Returns a <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code>
</a> representing a list of elements with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

## Unimplemented Specs


This class has 101 unimplemented properties and 34 unimplemented methods.
