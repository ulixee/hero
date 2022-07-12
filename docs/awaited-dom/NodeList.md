# [AwaitedDOM](/docs/hero/basic-client/awaited-dom) <span>/</span> NodeList

<div class='overview'><span class="seoSummary"><strong><code>NodeList</code></strong> objects are collections of nodes, usually returned by properties such as <code>Node.childNodes</code> and methods such as <code>document.querySelectorAll()</code>.</span></div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

The number of nodes in the <code>NodeList</code>.

#### **Type**: `Promise<number>`

## Methods

### .entries *()* <div class="specs"><i>W3C</i></div> {#entries}

Returns an <code>iterator</code>, allowing code to go through all key/value pairs contained in the collection. (In this case, the keys are numbers starting from <code>0</code> and the values are nodes.)

#### **Returns**: `Promise<>`

### .forEach *()* <div class="specs"><i>W3C</i></div> {#forEach}

Executes a provided function once per <code>NodeList</code> element, passing the element as an argument to the function.

#### **Returns**: `Promise<>`

### .item *(index)* <div class="specs"><i>W3C</i></div> {#item}

Returns an item in the list by its index, or <code>null</code> if the index is out-of-bounds.

#### **Arguments**:


 - index `number`. <code>index</code> is the index of the node to be fetched. The index is zero-based.

#### **Returns**: [`SuperNode`](/docs/hero/awaited-dom/super-node)

### .keys *()* <div class="specs"><i>W3C</i></div> {#keys}

Returns an <code>iterator</code>, allowing code to go through all the keys of the key/value pairs contained in the collection. (In this case, the keys are numbers starting from <code>0</code>.)

#### **Returns**: `Promise<>`

### .values *()* <div class="specs"><i>W3C</i></div> {#values}

Returns an <code>iterator</code> allowing code to go through all values (nodes) of the key/value pairs contained in the collection.

#### **Returns**: `Promise<>`
