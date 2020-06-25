# Selection

<div class='overview'><strong>This is an <a href="/en-US/docs/MDN/Contribute/Guidelines/Conventions_definitions#Experimental">experimental technology</a></strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">anchorNode</a>
    <div>Returns the <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> in which the selection begins. Can return <code>null</code> if selection never existed in the document (e.g., an iframe that was never clicked on).</div>
  </li>
  <li>
    <a href="">anchorOffset</a>
    <div>Returns a number representing the offset of the selection's anchor within the <code>anchorNode</code>. If <code>anchorNode</code> is a text node, this is the number of characters within anchorNode preceding the anchor. If <code>anchorNode</code> is an element, this is the number of child nodes of the <code>anchorNode</code> preceding the anchor.</div>
  </li>
  <li>
    <a href="">focusNode</a>
    <div>Returns the <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> in which the selection ends. Can return <code>null</code> if selection never existed in the document (for example, in an <code>iframe</code> that was never clicked on).</div>
  </li>
  <li>
    <a href="">focusOffset</a>
    <div>Returns a number representing the offset of the selection's anchor within the <code>focusNode</code>. If <code>focusNode</code> is a text node, this is the number of characters within <code>focusNode</code> preceding the focus. If <code>focusNode</code> is an element, this is the number of child nodes of the <code>focusNode</code> preceding the focus.</div>
  </li>
  <li>
    <a href="">isCollapsed</a>
    <div>Returns a Boolean indicating whether the selection's start and end points are at the same position.</div>
  </li>
  <li>
    <a href="">rangeCount</a>
    <div>Returns the number of ranges in the selection.</div>
  </li>
  <li>
    <a href="">type</a>
    <div>Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> describing the type of the current selection.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">addRange()</a>
    <div>A <a href="/en-US/docs/Web/API/Range" title="The Range interface represents a fragment of a document that can contain nodes and parts of text nodes."><code>Range</code></a> object that will be added to the selection.</div>
  </li>
  <li>
    <a href="">collapse()</a>
    <div>Collapses the current selection to a single point.</div>
  </li>
  <li>
    <a href="">collapseToEnd()</a>
    <div>Collapses the selection to the end of the last range in the selection.</div>
  </li>
  <li>
    <a href="">collapseToStart()</a>
    <div>Collapses the selection to the start of the first range in the selection.</div>
  </li>
  <li>
    <a href="">containsNode()</a>
    <div>Indicates if a certain node is part of the selection.</div>
  </li>
  <li>
    <a href="">deleteFromDocument()</a>
    <div>Deletes the selection's content from the document.</div>
  </li>
  <li>
    <a href="">empty()</a>
    <div>Removes all ranges from the selection. This is an alias for <code>removeAllRanges()</code> — See <a href="/en-US/docs/Web/API/Selection/removeAllRanges" title="The Selection.removeAllRanges() method removes all ranges from the selection, leaving the anchorNode and focusNode properties equal to null and leaving nothing selected."><code>Selection.removeAllRanges()</code></a> for more details.</div>
  </li>
  <li>
    <a href="">extend()</a>
    <div>Moves the focus of the selection to a specified point.</div>
  </li>
  <li>
    <a href="">getRangeAt()</a>
    <div>Returns a <a href="/en-US/docs/Web/API/Range" title="The Range interface represents a fragment of a document that can contain nodes and parts of text nodes."><code>Range</code></a> object representing one of the ranges currently selected.</div>
  </li>
  <li>
    <a href="">modify()</a>
    <div>Changes the current selection.</div>
  </li>
  <li>
    <a href="">removeAllRanges()</a>
    <div>Removes all ranges from the selection.</div>
  </li>
  <li>
    <a href="">removeRange()</a>
    <div>Removes a range from the selection.</div>
  </li>
  <li>
    <a href="">selectAllChildren()</a>
    <div>Adds all the children of the specified node to the selection.</div>
  </li>
  <li>
    <a href="">setBaseAndExtent()</a>
    <div>Sets the selection to be a range including all or parts of two specified DOM nodes, and any content located between them.</div>
  </li>
  <li>
    <a href="">setPosition()</a>
    <div>Collapses the current selection to a single point. This is an alias for <code>collapse()</code> — See <a href="/en-US/docs/Web/API/Selection/collapse" title="The Selection.collapse() method collapses the current selection to a single point. The document is not modified. If the content is focused and editable, the caret will blink there."><code>Selection.collapse()</code></a> for more details.</div>
  </li>
  <li>
    <a href="">toString()</a>
    <div>Returns a string currently being represented by the selection object, i.e. the currently selected text.</div>
  </li>
</ul>

## Events
