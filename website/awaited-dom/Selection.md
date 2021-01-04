# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> Selection

<div class='overview'><strong>This is an experimental technology</strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

### .anchorNode <div class="specs"><i>W3C</i></div> {#anchorNode}

Returns the <code>Node</code> in which the selection begins. Can return <code>null</code> if selection never existed in the document (e.g., an iframe that was never clicked on).

#### **Type**: [`SuperNode`](./super-node)

### .anchorOffset <div class="specs"><i>W3C</i></div> {#anchorOffset}

Returns a number representing the offset of the selection's anchor within the <code>anchorNode</code>. If <code>anchorNode</code> is a text node, this is the number of characters within anchorNode preceding the anchor. If <code>anchorNode</code> is an element, this is the number of child nodes of the <code>anchorNode</code> preceding the anchor.

#### **Type**: `Promise<number>`

### .focusNode <div class="specs"><i>W3C</i></div> {#focusNode}

Returns the <code>Node</code> in which the selection ends. Can return <code>null</code> if selection never existed in the document (for example, in an <code>iframe</code> that was never clicked on).

#### **Type**: [`SuperNode`](./super-node)

### .focusOffset <div class="specs"><i>W3C</i></div> {#focusOffset}

Returns a number representing the offset of the selection's anchor within the <code>focusNode</code>. If <code>focusNode</code> is a text node, this is the number of characters within <code>focusNode</code> preceding the focus. If <code>focusNode</code> is an element, this is the number of child nodes of the <code>focusNode</code> preceding the focus.

#### **Type**: `Promise<number>`

### .isCollapsed <div class="specs"><i>W3C</i></div> {#isCollapsed}

Returns a Boolean indicating whether the selection's start and end points are at the same position.

#### **Type**: `Promise<boolean>`

### .rangeCount <div class="specs"><i>W3C</i></div> {#rangeCount}

Returns the number of ranges in the selection.

#### **Type**: `Promise<number>`

### .type <div class="specs"><i>W3C</i></div> {#type}

Returns a `string` describing the type of the current selection.

#### **Type**: `Promise<string>`

## Methods

### .addRange*(range)* <div class="specs"><i>W3C</i></div> {#addRange}

A <code>Range</code> object that will be added to the selection.

#### **Arguments**:


 - range [`Range`](./range). A <code>Range</code> object that will be added to the <code>Selection</code>.

#### **Returns**: `Promise<void>`

### .collapse*(node, offset?)* <div class="specs"><i>W3C</i></div> {#collapse}

Collapses the current selection to a single point.

#### **Arguments**:


 - node [`Node`](./node). The caret location will be within this node. This value can also be set to <code>null</code> — if <code>null</code> is specified, the method will behave like <code>Selection.removeAllRanges()</code>, i.e. all ranges will be removed from the selection.
 - offset `number`. The offset in <code>node</code> to which the selection will be collapsed. If not specified, the default value <code>0</code> is used.

#### **Returns**: `Promise<void>`

### .collapseToEnd*()* <div class="specs"><i>W3C</i></div> {#collapseToEnd}

Collapses the selection to the end of the last range in the selection.

#### **Returns**: `Promise<void>`

### .collapseToStart*()* <div class="specs"><i>W3C</i></div> {#collapseToStart}

Collapses the selection to the start of the first range in the selection.

#### **Returns**: `Promise<void>`

### .containsNode*(node, allowPartialContainment?)* <div class="specs"><i>W3C</i></div> {#containsNode}

Indicates if a certain node is part of the selection.

#### **Arguments**:


 - node [`Node`](./node). The node that is being looked for in the selection.
 - allowPartialContainment `boolean`. When <code>true</code>, <code>containsNode()</code> returns <code>true</code> when a part of the node is part of the selection. When <code>false</code>, <code>containsNode()</code> only returns <code>true</code> when the entire node is part of the selection. If not specified, the default value <code>false</code> is used.

#### **Returns**: `Promise<boolean>`

### .deleteFromDocument*()* <div class="specs"><i>W3C</i></div> {#deleteFromDocument}

Deletes the selection's content from the document.

#### **Returns**: `Promise<void>`

### .empty*()* <div class="specs"><i>W3C</i></div> {#empty}

Removes all ranges from the selection. This is an alias for <code>removeAllRanges()</code> — See <code>Selection.removeAllRanges()</code> for more details.

#### **Returns**: `Promise<void>`

### .extend*(node, offset?)* <div class="specs"><i>W3C</i></div> {#extend}

Moves the focus of the selection to a specified point.

#### **Arguments**:


 - node [`Node`](./node). The node within which the focus will be moved.
 - offset `number`. The offset position within <code>node</code> where the focus will be moved to. If not specified, the default value <code>0</code> is used.

#### **Returns**: `Promise<void>`

### .getRangeAt*(index)* <div class="specs"><i>W3C</i></div> {#getRangeAt}

Returns a <code>Range</code> object representing one of the ranges currently selected.

#### **Arguments**:


 - index `number`. The zero-based index of the range to return. A negative number or a number greater than or equal to <code>Selection.rangeCount</code> will result in an error.

#### **Returns**: [`Range`](./range)

### .modify*(alter, direction, granularity)* <div class="specs"><i>W3C</i></div> {#modify}

Changes the current selection.

#### **Arguments**:


 - alter `string`. The type of change to apply. Specify <code>"move"</code> to move the current cursor position or <code>"extend"</code> to extend the current selection.
 - direction `string`. The direction in which to adjust the current selection. You can specify <code>"forward"</code> or <code>"backward"</code> to adjust in the appropriate direction based on the language at the selection point. If you want to adjust in a specific direction, you can specify <code>"left"</code> or <code>"right"</code>.
 - granularity `string`. The distance to adjust the current selection or cursor position. You can move by <code>"character"</code>, <code>"word"</code>, <code>"sentence"</code>, <code>"line"</code>, <code>"paragraph"</code>, <code>"lineboundary"</code>, <code>"sentenceboundary"</code>, <code>"paragraphboundary"</code>, or <code>"documentboundary"</code>.

#### **Returns**: `Promise<void>`

### .removeAllRanges*()* <div class="specs"><i>W3C</i></div> {#removeAllRanges}

Removes all ranges from the selection.

#### **Returns**: `Promise<void>`

### .removeRange*(range)* <div class="specs"><i>W3C</i></div> {#removeRange}

Removes a range from the selection.

#### **Arguments**:


 - range [`Range`](./range). A range object that will be removed to the selection.

#### **Returns**: `Promise<void>`

### .selectAllChildren*(node)* <div class="specs"><i>W3C</i></div> {#selectAllChildren}

Adds all the children of the specified node to the selection.

#### **Arguments**:


 - node [`Node`](./node). All children of <code>parentNode</code> will be selected. <code>parentNode</code> itself is not part of the selection.

#### **Returns**: `Promise<void>`

### .setBaseAndExtent*(anchorNode, anchorOffset, focusNode, focusOffset)* <div class="specs"><i>W3C</i></div> {#setBaseAndExtent}

Sets the selection to be a range including all or parts of two specified DOM nodes, and any content located between them.

#### **Arguments**:


 - anchorNode [`Node`](./node). The node at the start of the selection.
 - anchorOffset `number`. The number of child nodes from the start of the anchor node that should be excluded from the selection. So for example, if the value is 0 the whole node is included. If the value is 1, the whole node minus the first child node is included. And so on.
 - focusNode [`Node`](./node). The node at the end of the selection.
 - focusOffset `number`. The number of child nodes from the start of the focus node that should be included in the selection. So for example, if the value is 0 the whole node is excluded. If the value is 1, the first child node is included. And so on.

#### **Returns**: `Promise<void>`

### .setPosition*(node, offset?)* <div class="specs"><i>W3C</i></div> {#setPosition}

Collapses the current selection to a single point. This is an alias for <code>collapse()</code> — See <code>Selection.collapse()</code> for more details.

#### **Arguments**:


 - node [`Node`](./node). Needs content.
 - offset `number`. Needs content.

#### **Returns**: `Promise<void>`

### .toString*()* <div class="specs"><i>W3C</i></div> {#toString}

Returns a string currently being represented by the selection object, i.e. the currently selected text.

#### **Returns**: `Promise<string>`
