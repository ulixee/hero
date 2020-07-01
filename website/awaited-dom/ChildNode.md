# ChildNode

<div class='overview'><span class="seoSummary">The&nbsp;<code><strong>ChildNode</strong></code>&nbsp;mixin contains methods and properties that are common to all types of <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> objects that can have a parent.</span>&nbsp;It's implemented by <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>, <a href="/en-US/docs/Web/API/DocumentType" title="The DocumentType interface represents a Node containing a doctype."><code>DocumentType</code></a>, and <a href="/en-US/docs/Web/API/CharacterData" title="The CharacterData abstract interface represents a Node object that contains characters. This is an abstract interface, meaning there aren't any object of type CharacterData: it is implemented by other interfaces, like Text, Comment, or ProcessingInstruction which aren't abstract."><code>CharacterData</code></a> objects.</div>

## Properties

## Methods

### .after*(...args)* <div class="specs"><i>W3C</i></div> {#after}

Inserts a set of <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> or <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> objects in the <code>children</code> list of this <code>ChildNode</code>'s parent, just after this <code>ChildNode</code>. <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> objects are inserted as equivalent <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a> nodes.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .before*(...args)* <div class="specs"><i>W3C</i></div> {#before}

Inserts a set of <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> or <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> objects in the <code>children</code> list of this <code>ChildNode</code>'s parent, just before this <code>ChildNode</code>. <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> objects are inserted as equivalent <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a> nodes.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .remove*(...args)* <div class="specs"><i>W3C</i></div> {#remove}

Removes this <code>ChildNode</code> from the <code>children</code> list of its parent.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .replaceWith*(...args)* <div class="specs"><i>W3C</i></div> {#replaceWith}

Replaces this <code>ChildNode</code> in the <code>children</code> list of its parent with a set of <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> or <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> objects. <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> objects are inserted as equivalent <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a> nodes.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

## Events
