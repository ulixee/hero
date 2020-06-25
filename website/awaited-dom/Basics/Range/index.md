# Range

<div class='overview'>The <strong><code>Range</code></strong> interface represents a fragment of a document that can contain nodes and parts of text nodes.</div>

<div class='overview'>A range can be created by using the <a href="/en-US/docs/Web/API/Document/createRange" title="The Document.createRange() method returns a new Range object."><code>Document.createRange()</code></a> method. Range objects can also be retrieved by using the <a href="/en-US/docs/Web/API/Selection/getRangeAt" title="The Selection.getRangeAt() method returns a range object representing one of the ranges currently selected."><code>getRangeAt()</code></a> method of the <a href="/en-US/docs/Web/API/Selection" title="A Selection object represents the range of text selected by the user or the current position of the caret. To obtain a Selection object for examination or manipulation, call window.getSelection()."><code>Selection</code></a> object or the <a href="/en-US/docs/Web/API/Document/caretRangeFromPoint" title="The caretRangeFromPoint() method of the Document interface returns a Range object for the document fragment under the specified coordinates."><code>caretRangeFromPoint()</code></a> method of the <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> object.</div>

<div class='overview'>There also is the <a href="/en-US/docs/Web/API/Range/Range" title="The Range() constructor returns a newly created Range object whose start and end is the global Document object."><code>Range()</code></a> constructor available.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">commonAncestorContainer</a>
    <div>Returns the deepest <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> that contains the <code>startContainer</code> and <code>endContainer</code> nodes.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">cloneContents()</a>
    <div>Returns a <a href="/en-US/docs/Web/API/DocumentFragment" title="The DocumentFragment interface represents a minimal document object that has no parent. It is used as a lightweight version of Document that stores a segment of a document structure comprised of nodes just like a standard document."><code>DocumentFragment</code></a> copying the nodes of a <code>Range</code>.</div>
  </li>
  <li>
    <a href="">cloneRange()</a>
    <div>Returns a <code>Range</code> object with boundary points identical to the cloned <code>Range</code>.</div>
  </li>
  <li>
    <a href="">collapse()</a>
    <div>Collapses the <code>Range</code> to one of its boundary points.</div>
  </li>
  <li>
    <a href="">compareBoundaryPoints()</a>
    <div>Compares the boundary points of the <code>Range</code> with another <code>Range</code>.</div>
  </li>
  <li>
    <a href="">comparePoint()</a>
    <div>Returns -1, 0, or 1 indicating whether the point occurs before, inside, or after the <code>Range</code>.</div>
  </li>
  <li>
    <a href="">createContextualFragment()</a>
    <div>Returns a <a href="/en-US/docs/Web/API/DocumentFragment" title="The DocumentFragment interface represents a minimal document object that has no parent. It is used as a lightweight version of Document that stores a segment of a document structure comprised of nodes just like a standard document."><code>DocumentFragment</code></a> created from a given string of code.</div>
  </li>
  <li>
    <a href="">deleteContents()</a>
    <div>Removes the contents of a <code>Range</code> from the <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a>.</div>
  </li>
  <li>
    <a href="">detach()</a>
    <div>Releases the <code>Range</code> from use to improve performance.</div>
  </li>
  <li>
    <a href="">extractContents()</a>
    <div>Moves contents of a <code>Range</code> from the document tree into a <a href="/en-US/docs/Web/API/DocumentFragment" title="The DocumentFragment interface represents a minimal document object that has no parent. It is used as a lightweight version of Document that stores a segment of a document structure comprised of nodes just like a standard document."><code>DocumentFragment</code></a>.</div>
  </li>
  <li>
    <a href="">getBoundingClientRect()</a>
    <div>Returns a <a href="/en-US/docs/Web/API/DOMRect" title="A DOMRect represents a rectangle."><code>DOMRect</code></a> object which bounds the entire contents of the <code>Range</code>; this would be the union of all the rectangles returned by <a href="/en-US/docs/Web/API/Range/getClientRects" title="The Range.getClientRects() method returns a list of DOMRect objects representing the area of the screen occupied by the range. This is created by aggregating the results of calls to Element.getClientRects() for all the elements in the range."><code>range.getClientRects()</code></a>.</div>
  </li>
  <li>
    <a href="">getClientRects()</a>
    <div>Returns a list of <a href="/en-US/docs/Web/API/DOMRect" title="A DOMRect represents a rectangle."><code>DOMRect</code></a> objects that aggregates the results of <a href="/en-US/docs/Web/API/Element/getClientRects" title="The getClientRects() method of the Element interface returns a collection of DOMRect objects that indicate the bounding rectangles for each CSS border box in a client."><code>Element.getClientRects()</code></a> for all the elements in the <code>Range</code>.</div>
  </li>
  <li>
    <a href="">insertNode()</a>
    <div>Insert a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> at the start of a <code>Range</code>.</div>
  </li>
  <li>
    <a href="">intersectsNode()</a>
    <div>Returns a <code>boolean</code> indicating whether the given node intersects the <code>Range</code>.</div>
  </li>
  <li>
    <a href="">isPointInRange()</a>
    <div>Returns a <code>boolean</code> indicating whether the given point is in the <code>Range</code>.</div>
  </li>
  <li>
    <a href="">selectNode()</a>
    <div>Sets the <code>Range</code> to contain the <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> and its contents.</div>
  </li>
  <li>
    <a href="">selectNodeContents()</a>
    <div>Sets the <code>Range</code> to contain the contents of a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a>.</div>
  </li>
  <li>
    <a href="">setEnd()</a>
    <div>Sets the end position of a <code>Range</code>.</div>
  </li>
  <li>
    <a href="">setEndAfter()</a>
    <div>Sets the end position of a <code>Range</code> relative to another <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a>.</div>
  </li>
  <li>
    <a href="">setEndBefore()</a>
    <div>Sets the end position of a <code>Range</code> relative to another <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a>.</div>
  </li>
  <li>
    <a href="">setStart()</a>
    <div>Sets the start position of a <code>Range</code>.</div>
  </li>
  <li>
    <a href="">setStartAfter()</a>
    <div>Sets the start position of a <code>Range</code> relative to another <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a>.</div>
  </li>
  <li>
    <a href="">setStartBefore()</a>
    <div>Sets the start position of a <code>Range</code> relative to another <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a>.</div>
  </li>
  <li>
    <a href="">surroundContents()</a>
    <div>Moves content of a <code>Range</code> into a new <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a>.</div>
  </li>
  <li>
    <a href="">toString()</a>
    <div>Returns the text of the <code>Range</code>.</div>
  </li>
</ul>

## Events
