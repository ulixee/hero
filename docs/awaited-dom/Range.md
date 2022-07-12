# [AwaitedDOM](/docs/hero/basic-client/awaited-dom) <span>/</span> Range

<div class='overview'>The <strong><code>Range</code></strong> interface represents a fragment of a document that can contain nodes and parts of text nodes.</div>

<div class='overview'>A range can be created by using the <code>Document.createRange()</code> method. Range objects can also be retrieved by using the <code>getRangeAt()</code> method of the <code>Selection</code> object or the <code>caretRangeFromPoint()</code> method of the <code>Document</code> object.</div>

<div class='overview'>There also is the <code>Range()</code> constructor available.</div>

## Properties

### .commonAncestorContainer <div class="specs"><i>W3C</i></div> {#commonAncestorContainer}

Returns the deepest <code>Node</code> that contains the <code>startContainer</code> and <code>endContainer</code> nodes.

#### **Type**: [`SuperNode`](/docs/hero/awaited-dom/super-node)

### .collapsed <div class="specs"><i>W3C</i></div> {#collapsed}

A Boolean value which is&nbsp;<code>true</code>&nbsp;if the range is&nbsp;<strong>collapsed</strong>. A collapsed range is one whose start position and end position are the same, resulting in a zero-character-long range.

#### **Type**: `Promise<boolean>`

### .endContainer <div class="specs"><i>W3C</i></div> {#endContainer}

The DOM <code>Node</code> in which the end of the range, as specified by the <code>endOffset</code>&nbsp;property,&nbsp;is located.

#### **Type**: [`SuperNode`](/docs/hero/awaited-dom/super-node)

### .endOffset <div class="specs"><i>W3C</i></div> {#endOffset}

An integer value indicating the offset, in characters, from the beginning of the node's contents to the beginning of the range represented by the range object. This value must be less than the length of the <code>endContainer</code>&nbsp;node.

#### **Type**: `Promise<number>`

### .startContainer <div class="specs"><i>W3C</i></div> {#startContainer}

The DOM <code>Node</code> in which the beginning of the range, as specified by the <code>startOffset</code>&nbsp;property,&nbsp;is located.

#### **Type**: [`SuperNode`](/docs/hero/awaited-dom/super-node)

### .startOffset <div class="specs"><i>W3C</i></div> {#startOffset}

An integer value indicating the offset, in characters, from the beginning of the node's contents to the last character&nbsp;of the contents referred to&nbsp;&nbsp;by the range object. This value must be less than the length of the node indicated in&nbsp;<code>startContainer</code>.

#### **Type**: `Promise<number>`

## Methods

### .cloneContents *()* <div class="specs"><i>W3C</i></div> {#cloneContents}

Returns a <code>DocumentFragment</code> copying the nodes of a <code>Range</code>.

#### **Returns**: [`DocumentFragment`](/docs/hero/awaited-dom/document-fragment)

### .cloneRange *()* <div class="specs"><i>W3C</i></div> {#cloneRange}

Returns a <code>Range</code> object with boundary points identical to the cloned <code>Range</code>.

#### **Returns**: [`Range`](/docs/hero/awaited-dom/range)

### .collapse *(toStart?)* <div class="specs"><i>W3C</i></div> {#collapse}

Collapses the <code>Range</code> to one of its boundary points.

#### **Arguments**:


 - toStart `boolean`. A `boolean` value: <code>true</code> collapses the <code>Range</code> to its start, <code>false</code> to its end. If omitted, it defaults to <code>false</code> <span class="icon-only-inline" title="This is an experimental API that should not be used in production code."><i class="icon-beaker"> </i></span>.

#### **Returns**: `Promise<void>`

### .compareBoundaryPoints *(how, sourceRange)* <div class="specs"><i>W3C</i></div> {#compareBoundaryPoints}

Compares the boundary points of the <code>Range</code> with another <code>Range</code>.

#### **Arguments**:


 - how `number`. A constant describing the comparison method:
     <ul>
      <li><code>Range.END_TO_END</code> compares the end boundary-point of *sourceRange* to the end boundary-point of <code>Range</code>.</li>
      <li><code>Range.END_TO_START</code> compares the end boundary-point of *sourceRange* to the start boundary-point of <code>Range</code>.</li>
      <li><code>Range.START_TO_END</code> compares the start boundary-point of *sourceRange* to the end boundary-point of <code>Range</code>.</li>
      <li><code>Range.START_TO_START</code> compares the start boundary-point of *sourceRange* to the start boundary-point of <code>Range</code>.</li>
     </ul>
     <p>If the value of the parameter is invalid, a <code>DOMException</code> with a <code>NotSupportedError</code>&nbsp;code is thrown.</p>
 - sourceRange [`Range`](/docs/hero/awaited-dom/range). A <code>Range</code> to compare boundary points with the range.

#### **Returns**: `Promise<number>`

### .comparePoint *(node, offset)* <div class="specs"><i>W3C</i></div> {#comparePoint}

Returns -1, 0, or 1 indicating whether the point occurs before, inside, or after the <code>Range</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> to compare with the <code>Range</code>.
 - offset `number`. An integer greater than or equal to zero representing the offset inside the *referenceNode*.

#### **Returns**: `Promise<number>`

### .createContextualFragment *(fragment)* <div class="specs"><i>W3C</i></div> {#createContextualFragment}

Returns a <code>DocumentFragment</code> created from a given string of code.

#### **Arguments**:


 - fragment `string`. Text that contains text and tags to be converted to a document fragment.

#### **Returns**: [`DocumentFragment`](/docs/hero/awaited-dom/document-fragment)

### .deleteContents *()* <div class="specs"><i>W3C</i></div> {#deleteContents}

Removes the contents of a <code>Range</code> from the <code>Document</code>.

#### **Returns**: `Promise<void>`

### .detach *()* <div class="specs"><i>W3C</i></div> {#detach}

Releases the <code>Range</code> from use to improve performance.

#### **Returns**: `Promise<void>`

### .extractContents *()* <div class="specs"><i>W3C</i></div> {#extractContents}

Moves contents of a <code>Range</code> from the document tree into a <code>DocumentFragment</code>.

#### **Returns**: [`DocumentFragment`](/docs/hero/awaited-dom/document-fragment)

### .getBoundingClientRect *()* <div class="specs"><i>W3C</i></div> {#getBoundingClientRect}

Returns a <code>DOMRect</code> object which bounds the entire contents of the <code>Range</code>; this would be the union of all the rectangles returned by <code>range.getClientRects()</code>.

#### **Returns**: [`DOMRect`](/docs/hero/awaited-dom/dom-rect)

### .getClientRects *()* <div class="specs"><i>W3C</i></div> {#getClientRects}

Returns a list of <code>DOMRect</code> objects that aggregates the results of <code>Element.getClientRects()</code> for all the elements in the <code>Range</code>.

#### **Returns**: `DOMRectList`

### .insertNode *(node)* <div class="specs"><i>W3C</i></div> {#insertNode}

Insert a <code>Node</code> at the start of a <code>Range</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> to insert at the start of the <code>range</code>.

#### **Returns**: `Promise<void>`

### .intersectsNode *(node)* <div class="specs"><i>W3C</i></div> {#intersectsNode}

Returns a <code>boolean</code> indicating whether the given node intersects the <code>Range</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> to compare with the <code>Range</code>.

#### **Returns**: `Promise<boolean>`

### .isPointInRange *(node, offset)* <div class="specs"><i>W3C</i></div> {#isPointInRange}

Returns a <code>boolean</code> indicating whether the given point is in the <code>Range</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> to compare with the <code>Range</code>.
 - offset `number`. The offset into <code>Node</code> of the point to compare with the <code>Range</code>.

#### **Returns**: `Promise<boolean>`

### .selectNode *(node)* <div class="specs"><i>W3C</i></div> {#selectNode}

Sets the <code>Range</code> to contain the <code>Node</code> and its contents.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> to select within a <code>Range</code>.

#### **Returns**: `Promise<void>`

### .selectNodeContents *(node)* <div class="specs"><i>W3C</i></div> {#selectNodeContents}

Sets the <code>Range</code> to contain the contents of a <code>Node</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> whose contents will be selected within a <code>Range</code>.

#### **Returns**: `Promise<void>`

### .setEnd *(node, offset)* <div class="specs"><i>W3C</i></div> {#setEnd}

Sets the end position of a <code>Range</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> inside which the <code>Range</code> should end.
 - offset `number`. An integer greater than or equal to zero representing the offset for the end of the <code>Range</code> from the start of <code>endNode</code>.

#### **Returns**: `Promise<void>`

### .setEndAfter *(node)* <div class="specs"><i>W3C</i></div> {#setEndAfter}

Sets the end position of a <code>Range</code> relative to another <code>Node</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> to end the <code>Range</code> after.

#### **Returns**: `Promise<void>`

### .setEndBefore *(node)* <div class="specs"><i>W3C</i></div> {#setEndBefore}

Sets the end position of a <code>Range</code> relative to another <code>Node</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> to end the <code>Range</code> before.

#### **Returns**: `Promise<void>`

### .setStart *(node, offset)* <div class="specs"><i>W3C</i></div> {#setStart}

Sets the start position of a <code>Range</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> where the <code>Range</code> should start.
 - offset `number`. An integer greater than or equal to zero representing the offset for the start of the <code>Range</code> from the start of <code>startNode</code>.

#### **Returns**: `Promise<void>`

### .setStartAfter *(node)* <div class="specs"><i>W3C</i></div> {#setStartAfter}

Sets the start position of a <code>Range</code> relative to another <code>Node</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> to start the <code>Range</code> after.

#### **Returns**: `Promise<void>`

### .setStartBefore *(node)* <div class="specs"><i>W3C</i></div> {#setStartBefore}

Sets the start position of a <code>Range</code> relative to another <code>Node</code>.

#### **Arguments**:


 - node [`Node`](/docs/hero/awaited-dom/node). The <code>Node</code> before which the <code>Range</code> should start.

#### **Returns**: `Promise<void>`

### .surroundContents *(newParent)* <div class="specs"><i>W3C</i></div> {#surroundContents}

Moves content of a <code>Range</code> into a new <code>Node</code>.

#### **Arguments**:


 - newParent [`Node`](/docs/hero/awaited-dom/node). A <code>Node</code> with which to surround the contents.

#### **Returns**: `Promise<void>`

### .toString *()* <div class="specs"><i>W3C</i></div> {#toString}

Returns the text of the <code>Range</code>.

#### **Returns**: `Promise<string>`
