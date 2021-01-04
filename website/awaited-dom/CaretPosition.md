# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> CaretPosition

<div class='overview'><strong>This is an experimental technology</strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

### .offset <div class="specs"><i>W3C</i></div> {#offset}

Returns a <code>long</code> representing the character offset in the caret position node.

#### **Type**: `Promise<number>`

### .offsetNode <div class="specs"><i>W3C</i></div> {#offsetNode}

Returns a <code>Node</code> containing the found node at the caret's position.

#### **Type**: [`SuperNode`](./super-node)

## Methods

### .getClientRect*()* <div class="specs"><i>W3C</i></div> {#getClientRect}

Needs content.

#### **Returns**: [`DOMRect`](./dom-rect)
