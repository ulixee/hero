# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLCollection

<div class='overview'>The <strong><code>HTMLCollection</code></strong> interface represents a generic collection (array-like object similar to <a href="/en-US/docs/Web/JavaScript/Reference/Functions/arguments" title="arguments is an Array-like object accessible inside functions that contains the values of the arguments passed to that function."><code>arguments</code></a>) of elements (in document order) and offers methods and properties for selecting from the list.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns the number of items in the collection.

#### **Type**: `null`

## Methods

### .item*(...args)* <div class="specs"><i>W3C</i></div> {#item}

Returns the specific node at the given zero-based <code>index</code> into the list. Returns <code>null</code> if the <code>index
</code> is out of range.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .namedItem*(...args)* <div class="specs"><i>W3C</i></div> {#namedItem}

Returns the specific node whose ID or, as a fallback, name matches the string specified by <code>name</code>. Matching by name is only done as a last resort, only in HTML, and only if the referenced element supports the <code>name</code> attribute. Returns <code>null
</code> if no node exists by the given name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
