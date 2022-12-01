# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> HTMLCollection

<div class='overview'>The <strong><code>HTMLCollection</code></strong> interface represents a generic collection (array-like object similar to <code>arguments</code>) of elements (in document order) and offers methods and properties for selecting from the list.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns the number of items in the collection.

#### **Type**: `Promise<number>`

### .length <div class="specs"><i>W3C</i></div> {#length}

Needs content.

#### **Type**: `Promise<number>`

## Methods

### .item *(index)* <div class="specs"><i>W3C</i></div> {#item}

Returns the specific node at the given zero-based <code>index</code> into the list. Returns <code>null</code> if the <code>index</code> is out of range.

#### **Arguments**:


 - index `number`. The position of the <code>Node</code> to be returned. Elements appear in an <code>HTMLCollection</code> in the same order in which they appear in the document's source.

#### **Returns**: [`SuperElement`](./super-element.md)

### .namedItem *(name)* <div class="specs"><i>W3C</i></div> {#namedItem}

Returns the specific node whose ID or, as a fallback, name matches the string specified by <code>name</code>. Matching by name is only done as a last resort, only in HTML, and only if the referenced element supports the <code>name</code> attribute. Returns <code>null</code> if no node exists by the given name.

#### **Arguments**:


 - name `string`. Needs content.

#### **Returns**: [`SuperElement`](./super-element.md)

### .item *(index)* <div class="specs"><i>W3C</i></div> {#item}

Needs content.

#### **Arguments**:


 - index `number`. Needs content.

#### **Returns**: [`SuperElement`](./super-element.md)
