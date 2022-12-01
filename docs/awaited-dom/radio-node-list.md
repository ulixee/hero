# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> RadioNodeList

<div class='overview'>The <strong><code>RadioNodeList</code></strong> interface represents a collection of radio elements in a <code>&lt;form&gt;</code> or a <code>&lt;fieldset&gt;</code> element.</div>

## Properties

### .value <div class="specs"><i>W3C</i></div> {#value}

If the underlying element collection contains radio buttons, the <code>value</code> property represents the checked radio button. On retrieving the <code>value</code> property, the <code>value</code> of the currently <code>checked</code> radio button is returned as a string. If the collection does not contain any radio buttons or none of the radio buttons in the collection is in <code>checked</code> state, the empty string is returned. On setting the <code>value</code> property, the first radio button input element whose <code>value</code> property is equal to the new value will be set to <code>checked</code>.

#### **Type**: `Promise<string>`

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

#### **Returns**: [`SuperNode`](./super-node.md)

### .keys *()* <div class="specs"><i>W3C</i></div> {#keys}

Returns an <code>iterator</code>, allowing code to go through all the keys of the key/value pairs contained in the collection. (In this case, the keys are numbers starting from <code>0</code>.)

#### **Returns**: `Promise<>`

### .values *()* <div class="specs"><i>W3C</i></div> {#values}

Returns an <code>iterator</code> allowing code to go through all values (nodes) of the key/value pairs contained in the collection.

#### **Returns**: `Promise<>`
