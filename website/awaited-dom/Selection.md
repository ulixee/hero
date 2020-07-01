# Selection

<div class='overview'><strong>This is an <a href="/en-US/docs/MDN/Contribute/Guidelines/Conventions_definitions#Experimental">experimental technology</a></strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

### .anchorNode <div class="specs"><i>W3C</i></div> {#anchorNode}

Returns the <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> in which the selection begins. Can return <code>null</code> if selection never existed in the document (e.g., an iframe that was never clicked on).

#### **Type**: `SuperDocument`

### .anchorOffset <div class="specs"><i>W3C</i></div> {#anchorOffset}

Returns a number representing the offset of the selection's anchor within the <code>anchorNode</code>. If <code>anchorNode</code> is a text node, this is the number of characters within anchorNode preceding the anchor. If <code>anchorNode</code> is an element, this is the number of child nodes of the <code>anchorNode</code> preceding the anchor.

#### **Type**: `SuperDocument`

### .focusNode <div class="specs"><i>W3C</i></div> {#focusNode}

Returns the <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> in which the selection ends. Can return <code>null</code> if selection never existed in the document (for example, in an <code>iframe</code> that was never clicked on).

#### **Type**: `SuperDocument`

### .focusOffset <div class="specs"><i>W3C</i></div> {#focusOffset}

Returns a number representing the offset of the selection's anchor within the <code>focusNode</code>. If <code>focusNode</code> is a text node, this is the number of characters within <code>focusNode</code> preceding the focus. If <code>focusNode</code> is an element, this is the number of child nodes of the <code>focusNode</code> preceding the focus.

#### **Type**: `SuperDocument`

### .isCollapsed <div class="specs"><i>W3C</i></div> {#isCollapsed}

Returns a Boolean indicating whether the selection's start and end points are at the same position.

#### **Type**: `SuperDocument`

### .rangeCount <div class="specs"><i>W3C</i></div> {#rangeCount}

Returns the number of ranges in the selection.

#### **Type**: `SuperDocument`

### .type <div class="specs"><i>W3C</i></div> {#type}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> describing the type of the current selection.

#### **Type**: `SuperDocument`

## Methods

### .addRange*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#addRange}

A <a href="/en-US/docs/Web/API/Range" title="The Range interface represents a fragment of a document that can contain nodes and parts of text nodes."><code>Range</code></a> object that will be added to the selection.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .collapse*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#collapse}

Collapses the current selection to a single point.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .collapseToEnd*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#collapseToEnd}

Collapses the selection to the end of the last range in the selection.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .collapseToStart*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#collapseToStart}

Collapses the selection to the start of the first range in the selection.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .containsNode*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#containsNode}

Indicates if a certain node is part of the selection.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .deleteFromDocument*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#deleteFromDocument}

Deletes the selection's content from the document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .empty*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#empty}

Removes all ranges from the selection. This is an alias for <code>removeAllRanges()</code> — See <a href="/en-US/docs/Web/API/Selection/removeAllRanges" title="The Selection.removeAllRanges() method removes all ranges from the selection, leaving the anchorNode and focusNode properties equal to null and leaving nothing selected."><code>Selection.removeAllRanges()</code></a> for more details.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .extend*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#extend}

Moves the focus of the selection to a specified point.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getRangeAt*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getRangeAt}

Returns a <a href="/en-US/docs/Web/API/Range" title="The Range interface represents a fragment of a document that can contain nodes and parts of text nodes."><code>Range</code></a> object representing one of the ranges currently selected.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .modify*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#modify}

Changes the current selection.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .removeAllRanges*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#removeAllRanges}

Removes all ranges from the selection.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .removeRange*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#removeRange}

Removes a range from the selection.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .selectAllChildren*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#selectAllChildren}

Adds all the children of the specified node to the selection.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setBaseAndExtent*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setBaseAndExtent}

Sets the selection to be a range including all or parts of two specified DOM nodes, and any content located between them.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setPosition*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setPosition}

Collapses the current selection to a single point. This is an alias for <code>collapse()</code> — See <a href="/en-US/docs/Web/API/Selection/collapse" title="The Selection.collapse() method collapses the current selection to a single point. The document is not modified. If the content is focused and editable, the caret will blink there."><code>Selection.collapse()</code></a> for more details.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .toString*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#toString}

Returns a string currently being represented by the selection object, i.e. the currently selected text.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
