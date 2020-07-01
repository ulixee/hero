# SuperText

<div class='overview'><span class="seoSummary">The <strong><code>Text</code></strong> interface represents the textual content of <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> or <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a>. </span></div>

<div class='overview'>If an element has no markup within its content, it has a single child implementing <code>Text</code> that contains the element's text. However, if the element contains markup, it is parsed into information items and <code>Text</code> nodes that form its children.</div>

<div class='overview'>New documents have a single <code>Text</code> node for each block of text. Over time, more <code>Text</code> nodes may be created as the document's content changes. The <a href="/en-US/docs/Web/API/Node/normalize" title="The Node.normalize() method puts the specified node and all of its sub-tree into a &quot;normalized&quot; form. In a normalized sub-tree, no text nodes in the sub-tree are empty and there are no adjacent text nodes."><code>Node.normalize()</code></a> method merges adjacent <code>Text</code> objects back into a single node for each block of text.</div>

## Properties

### .wholeText <div class="specs"><i>W3C</i></div> {#wholeText}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the text of all <code>Text</code> nodes logically adjacent to this <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a>, concatenated in document order.

#### **Type**: `SuperDocument`

## Methods

### .splitText*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#splitText}

Breaks the node into two nodes at a specified offset.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
