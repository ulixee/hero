# HTMLOptionsCollection

<div class='overview'><em>This interface inherits the methods of its parent,&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a>.</em></div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

As optionally allowed by the spec, this property isn't read-only. You can either remove options from the end by lowering the value, or add blank options at the end by raising the value. Mozilla allows this, while other implementations could potentially throw a <a href="/en-US/docs/DOM/DOMException" title="DOM/DOMException">DOMException</a>.

#### **Type**: `SuperDocument`

### .selectedIndex <div class="specs"><i>W3C</i></div> {#selectedIndex}

Needs content.

#### **Type**: `SuperDocument`

## Methods

### .add*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#add}

Inserts element before the node given by before.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .remove*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#remove}

Removes the item with index index from the collection.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
