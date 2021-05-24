# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> DocumentOrShadowRoot

<div class='overview'><span class="seoSummary">The <strong><code>DocumentOrShadowRoot</code></strong> mixin of the&nbsp;Shadow DOM API provides APIs that are shared between documents and shadow roots. The following features are included in both <code>Document</code> and <code>ShadowRoot</code>. </span></div>

## Properties

### .activeElement <div class="specs"><i>W3C</i></div> {#activeElement}

Returns the <code>Element</code> within the shadow tree that has focus.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### .fullscreenElement <div class="specs"><i>W3C</i></div> {#fullscreenElement}

Returns the <code>Element</code> that's currently in full screen mode for this document.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### .pointerLockElement <div class="specs"><i>W3C</i></div> {#pointerLockElement}

Returns the element set as the target for mouse events while the pointer is locked. It returns&nbsp;<code>null</code> if lock is pending, the pointer is unlocked, or if the target is in another document.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

## Methods

### .caretPositionFromPoint*(x, y)* <div class="specs"><i>W3C</i></div> {#caretPositionFromPoint}

Returns a <code>CaretPosition</code> object containing the DOM node containing the caret, and caret's character offset within that node.

#### **Arguments**:


 - x `number`. The horizontal coordinate of a point.
 - y `number`. The vertical coordinate of a point.

#### **Returns**: [`CaretPosition`](/docs/awaited-dom/caret-position)

### .elementFromPoint*(x, y)* <div class="specs"><i>W3C</i></div> {#elementFromPoint}

Returns the topmost element at the specified coordinates.

#### **Arguments**:


 - x `number`. The horizontal coordinate of a point, relative to the left edge of the current viewport.
 - y `number`. The vertical coordinate of a point, relative to the top edge of the current viewport.

#### **Returns**: [`SuperElement`](/docs/awaited-dom/super-element)

### .getSelection*()* <div class="specs"><i>W3C</i></div> {#getSelection}

Returns a <code>Selection</code> object representing the range of text selected by the user, or the current position of the caret.

#### **Returns**: [`Selection`](/docs/awaited-dom/selection)

## Unimplemented Specs

#### Methods

|     |     |
| --- | --- |
| `elementsFromPoint()` |  |
