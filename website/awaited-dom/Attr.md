# Attr

<div class='overview'>The <code><strong>Attr</strong></code> interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., <a href="/en-US/docs/Web/API/Element/getAttribute" title="The getAttribute() method of the Element interface returns the value of a specified attribute on the element."><code>Element.getAttribute()</code></a>), but certain functions (e.g., <a href="/en-US/docs/Web/API/Element/getAttributeNode" title="Returns the specified attribute of the specified element, as an Attr node."><code>Element.getAttributeNode()</code></a>) or means of iterating return <code>Attr</code> types.</div>

## Properties

### .localName <div class="specs"><i>W3C</i></div> {#localName}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the local part of the qualified name of the attribute.

#### **Type**: `null`

### .name <div class="specs"><i>W3C</i></div> {#name}

The attribute's name.

#### **Type**: `null`

### .namespaceURI <div class="specs"><i>W3C</i></div> {#namespaceURI}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the namespace URI of the attribute, or <code>null</code> if there is no namespace.

#### **Type**: `null`

### .ownerElement <div class="specs"><i>W3C</i></div> {#ownerElement}


 <p>The element holding the attribute.</p>
 <div class="note">
 <p><strong>Note:</strong> DOM Level 4 removed this property. The assumption was that since you get an <code>Attr</code> object from an <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>, you should already know the associated element.<br>
  As that doesn't hold true in cases like <code>Attr</code> objects being returned by <a href="/en-US/docs/Web/API/Document/evaluate" title="Returns an XPathResult based on an XPath expression and other given parameters."><code>Document.evaluate</code></a>, the DOM Living Standard reintroduced the property.</p>
 <p>Gecko outputs a deprecation note starting from Gecko 7.0 (Firefox 7.0 / Thunderbird 7.0 / SeaMonkey 2.4). This note was removed again in Gecko 49.0 (Firefox 49.0 / Thunderbird 49.0 / SeaMonkey 2.46).</p>
 </div>
 

#### **Type**: `null`

### .prefix <div class="specs"><i>W3C</i></div> {#prefix}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the namespace prefix of the attribute, or <code>null</code> if no prefix is specified.

#### **Type**: `null`

### .specified <div class="specs"><i>W3C</i></div> {#specified}

This property always returns <code>true</code>. Originally, it returned <code>true </code>if the attribute was explicitly specified in the source code or by a script, and <code>false</code> if its value came from the default one defined in the document's <acronym title="Document Type Definition">DTD</acronym>.

#### **Type**: `null`

### .value <div class="specs"><i>W3C</i></div> {#value}

The attribute's value.

#### **Type**: `null`

## Methods

## Events
