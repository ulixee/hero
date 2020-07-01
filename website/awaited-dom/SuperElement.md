# SuperElement

<div class='overview'><span class="seoSummary"><strong><code>Element</code></strong> is the most general base class from which all element objects (i.e. objects that represent elements) in a <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from <code>Element</code>.</span> For example, the <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface is the base interface for HTML elements, while the <a href="/en-US/docs/Web/API/SVGElement" title="All of the SVG DOM interfaces that correspond directly to elements in the SVG language derive from the SVGElement interface."><code>SVGElement</code></a> interface is the basis for all SVG elements. Most functionality is specified further down the class hierarchy.</div>

<div class='overview'>Languages outside the realm of the Web platform, like XUL through the <code>XULElement</code> interface, also implement <code>Element</code>.</div>

## Properties

### .attributes <div class="specs"><i>W3C</i></div> {#attributes}

Returns a <a href="/en-US/docs/Web/API/NamedNodeMap" title="The NamedNodeMap interface represents a collection of Attr objects. Objects inside a NamedNodeMap are not in any particular order, unlike NodeList, although they may be accessed by an index as in an array."><code>NamedNodeMap</code></a> object containing the assigned attributes of the corresponding HTML element.

#### **Type**: `SuperDocument`

### .classList <div class="specs"><i>W3C</i></div> {#classList}

Returns a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code></a> containing the list of class attributes.

#### **Type**: `SuperDocument`

### .className <div class="specs"><i>W3C</i></div> {#className}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the class of the element.

#### **Type**: `SuperDocument`

### .clientHeight <div class="specs"><i>W3C</i></div> {#clientHeight}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code></a> representing the inner height of the element.

#### **Type**: `SuperDocument`

### .clientLeft <div class="specs"><i>W3C</i></div> {#clientLeft}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code></a> representing the width of the left border of the element.

#### **Type**: `SuperDocument`

### .clientTop <div class="specs"><i>W3C</i></div> {#clientTop}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code></a> representing the width of the top border of the element.

#### **Type**: `SuperDocument`

### .clientWidth <div class="specs"><i>W3C</i></div> {#clientWidth}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code></a> representing the inner width of the element.

#### **Type**: `SuperDocument`

### .id <div class="specs"><i>W3C</i></div> {#id}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the id of the element.

#### **Type**: `SuperDocument`

### .innerHTML <div class="specs"><i>W3C</i></div> {#innerHTML}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the markup of the element's content.

#### **Type**: `SuperDocument`

### .localName <div class="specs"><i>W3C</i></div> {#localName}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the local part of the qualified name of the element.

#### **Type**: `SuperDocument`

### .namespaceURI <div class="specs"><i>W3C</i></div> {#namespaceURI}

The namespace URI of the element, or <code>null</code> if it is no namespace.
 <div class="note">
 <p><strong>Note:</strong> In Firefox 3.5 and earlier, HTML elements are in no namespace. In later versions, HTML elements are in the <code><a class="external linkification-ext" href="http://www.w3.org/1999/xhtml" rel="noopener" title="Linkification: http://www.w3.org/1999/xhtml">http://www.w3.org/1999/xhtml</a></code> namespace in both HTML and XML trees. </p>
 </div>
 

#### **Type**: `SuperDocument`

### .onfullscreenchange <div class="specs"><i>W3C</i></div> {#onfullscreenchange}

An event handler for the <code><a href="/en-US/docs/Web/Events/fullscreenchange" title="/en-US/docs/Web/Events/fullscreenchange">fullscreenchange</a></code> event, which is sent when the element enters or exits full-screen mode. This can be used to watch both for successful expected transitions, but also to watch for unexpected changes, such as when your app is running in the background.

#### **Type**: `SuperDocument`

### .onfullscreenerror <div class="specs"><i>W3C</i></div> {#onfullscreenerror}

An event handler for the <code><a href="/en-US/docs/Web/Events/fullscreenerror" title="/en-US/docs/Web/Events/fullscreenerror">fullscreenerror</a></code> event, which is sent when an error occurs while attempting to change into full-screen mode.

#### **Type**: `SuperDocument`

### .outerHTML <div class="specs"><i>W3C</i></div> {#outerHTML}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the markup of the element including its content. When used as a setter, replaces the element with nodes parsed from the given string.

#### **Type**: `SuperDocument`

### .part <div class="specs"><i>W3C</i></div> {#part}

Represents the part identifier(s) of the element (i.e. set using the <code>part</code> attribute), returned as a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code></a>.

#### **Type**: `SuperDocument`

### .prefix <div class="specs"><i>W3C</i></div> {#prefix}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the namespace prefix of the element, or <code>null</code> if no prefix is specified.

#### **Type**: `SuperDocument`

### .scrollHeight <div class="specs"><i>W3C</i></div> {#scrollHeight}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code></a> representing the scroll view height of an element.

#### **Type**: `SuperDocument`

### .scrollLeft <div class="specs"><i>W3C</i></div> {#scrollLeft}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code></a> representing the left scroll offset of the element.

#### **Type**: `SuperDocument`

### .scrollTop <div class="specs"><i>W3C</i></div> {#scrollTop}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code></a> representing number of pixels the top of the document is scrolled vertically.

#### **Type**: `SuperDocument`

### .scrollWidth <div class="specs"><i>W3C</i></div> {#scrollWidth}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code></a> representing the scroll view width of the element.

#### **Type**: `SuperDocument`

### .shadowRoot <div class="specs"><i>W3C</i></div> {#shadowRoot}

Returns the open shadow root that is hosted by the element, or null if no open shadow root is present.

#### **Type**: `SuperDocument`

### .slot <div class="specs"><i>W3C</i></div> {#slot}

Returns the name of the shadow DOM slot the element is inserted in.

#### **Type**: `SuperDocument`

### .tagName <div class="specs"><i>W3C</i></div> {#tagName}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/String" title="The String global object is a constructor for strings or a sequence of characters."><code>String</code></a> with the name of the tag for the given element.

#### **Type**: `SuperDocument`

## Methods

### .attachShadow*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#attachShadow}

Attaches a shadow DOM tree to the specified element and returns a reference to its <a href="/en-US/docs/Web/API/ShadowRoot" title="The ShadowRoot interface of the Shadow DOM API is the root node of a DOM subtree that is rendered separately from a document's main DOM tree."><code>ShadowRoot</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .closest*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#closest}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> which is the closest ancestor of the current element (or the current element itself) which matches the selectors given in parameter.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .computedStyleMap*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#computedStyleMap}

Returns a <a href="/en-US/docs/Web/API/StylePropertyMapReadOnly" title="The StylePropertyMapReadOnly interface of the the CSS Typed Object Model API provides a read-only representation of a CSS declaration block that is an alternative to CSSStyleDeclaration. Retrieve an instance of this interface using Element.computedStyleMap()."><code>StylePropertyMapReadOnly</code></a> interface which provides a read-only representation of a CSS declaration block that is an alternative to <a href="/en-US/docs/Web/API/CSSStyleDeclaration" title="The CSSStyleDeclaration interface represents an object that is a CSS declaration block, and exposes style information and various style-related methods and properties."><code>CSSStyleDeclaration</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getAttribute*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getAttribute}

Retrieves the value of the named attribute from the current node and returns it as an <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object" title="The Object class represents one of JavaScript's data types. It is used to store&nbsp;various keyed collections and more complex entities. Objects can be created using the Object() constructor or the object initializer / literal syntax."><code>Object</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getAttributeNames*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getAttributeNames}

Returns an array of attribute names from the current element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getAttributeNode*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getAttributeNode}

Retrieves the node representation of the named attribute from the current node and returns it as an <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getAttributeNodeNS*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getAttributeNodeNS}

Retrieves the node representation of the attribute with the specified name and namespace, from the current node and returns it as an <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getAttributeNS*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getAttributeNS}

Retrieves the value of the attribute with the specified name and namespace, from the current node and returns it as an <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object" title="The Object class represents one of JavaScript's data types. It is used to store&nbsp;various keyed collections and more complex entities. Objects can be created using the Object() constructor or the object initializer / literal syntax."><code>Object</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getBoundingClientRect*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getBoundingClientRect}

Returns the size of an element and its position relative to the viewport.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getClientRects*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getClientRects}

Returns a collection of rectangles that indicate the bounding rectangles for each line of text in a client.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getElementsByClassName*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getElementsByClassName}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> that contains all descendants of the current element that possess the list of classes given in the parameter.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getElementsByTagName*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getElementsByTagName}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> containing all descendant elements, of a particular tag name, from the current element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getElementsByTagNameNS*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getElementsByTagNameNS}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> containing all descendant elements, of a particular tag name and namespace, from the current element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .hasAttribute*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#hasAttribute}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> indicating if the element has the specified attribute or not.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .hasAttributeNS*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#hasAttributeNS}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> indicating if the element has the specified attribute, in the specified namespace, or not.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .hasAttributes*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#hasAttributes}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> indicating if the element has one or more HTML attributes present.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .hasPointerCapture*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#hasPointerCapture}

Indicates whether the element on which it is invoked has pointer capture for the pointer identified by the given pointer ID.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .insertAdjacentElement*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#insertAdjacentElement}

Inserts a given element node at a given position relative to the element it is invoked upon.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .insertAdjacentHTML*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#insertAdjacentHTML}

Parses the text as HTML or XML and inserts the resulting nodes into the tree in the position given.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .insertAdjacentText*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#insertAdjacentText}

Inserts a given text node at a given position relative to the element it is invoked upon.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .matches*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#matches}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> indicating whether or not the element would be selected by the specified selector string.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .releasePointerCapture*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#releasePointerCapture}

Releases (stops) pointer capture that was previously set for a specific <a href="/en-US/docs/Web/API/PointerEvent" title="The PointerEvent interface represents the state of a DOM event produced by a pointer such as the geometry of the contact point, the device type that generated the event, the amount of pressure that was applied on the contact surface, etc."><code>pointer event</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .removeAttribute*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#removeAttribute}

Removes the named attribute from the current node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .removeAttributeNode*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#removeAttributeNode}

Removes the node representation of the named attribute from the current node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .removeAttributeNS*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#removeAttributeNS}

Removes the attribute with the specified name and namespace, from the current node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .requestFullscreen*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#requestFullscreen}

Asynchronously asks the browser to make the element full-screen.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .requestPointerLock*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#requestPointerLock}

Allows to asynchronously ask for the pointer to be locked on the given element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .scroll*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#scroll}

Scrolls to a particular set of coordinates inside a given element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .scrollBy*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#scrollBy}

Scrolls an element by the given amount.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .scrollIntoView*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#scrollIntoView}

Scrolls the page until the element gets into the view.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .scrollTo*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#scrollTo}

Scrolls to a particular set of coordinates inside a given element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setAttribute*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setAttribute}

Sets the value of a named attribute of the current node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setAttributeNode*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setAttributeNode}

Sets the node representation of the named attribute from the current node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setAttributeNodeNS*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setAttributeNodeNS}

Sets the node representation of the attribute with the specified name and namespace, from the current node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setAttributeNS*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setAttributeNS}

Sets the value of the attribute with the specified name and namespace, from the current node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setPointerCapture*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setPointerCapture}

Designates a specific element as the capture target of future <a href="/en-US/docs/Web/API/Pointer_events">pointer events</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .toggleAttribute*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#toggleAttribute}

Toggles a boolean attribute, removing it if it is present and adding it if it is not present, on the specified element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
