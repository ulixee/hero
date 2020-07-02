# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLOptionsCollection

<div class='overview'><em>This interface inherits the methods of its parent,&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a>.</em></div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns the number of items in the collection.

#### **Type**: `number`

### .length <div class="specs"><i>W3C</i></div> {#length}

Needs content.

#### **Type**: `number`

## Methods

### .item*(...args)* <div class="specs"><i>W3C</i></div> {#item}

Returns the specific node at the given zero-based <code>index</code> into the list. Returns <code>null</code> if the <code>index
</code> is out of range.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### .namedItem*(...args)* <div class="specs"><i>W3C</i></div> {#namedItem}

Returns the specific node whose ID or, as a fallback, name matches the string specified by <code>name</code>. Matching by name is only done as a last resort, only in HTML, and only if the referenced element supports the <code>name</code> attribute. Returns <code>null
</code> if no node exists by the given name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### .item*(...args)* <div class="specs"><i>W3C</i></div> {#item}

Needs content.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

## Unimplemented Specs


This class has 2 unimplemented properties and 2 unimplemented methods.
