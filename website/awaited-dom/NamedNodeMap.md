# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> NamedNodeMap

<div class='overview'>The <code><strong>NamedNodeMap</strong></code> interface represents a collection of <code>Attr</code> objects. Objects inside a <code>NamedNodeMap</code> are not in any particular order, unlike <code>NodeList</code>, although they may be accessed by an index as in an array.</div>

<div class='overview'>A <code>NamedNodeMap</code> object is <em>live</em> and will thus be auto-updated if changes are made to its contents internally or elsewhere.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns the amount of objects in the map.

#### **Type**: `Promise<number>`

## Methods

### .getNamedItem*(qualifiedName)* <div class="specs"><i>W3C</i></div> {#getNamedItem}

Returns a <code>Attr</code>, corresponding to the given name.

#### **Arguments**:


 - qualifiedName `string`. <code>name</code> is the name of the desired attribute

#### **Returns**: `Promise<Attr>`

### .getNamedItemNS*(namespace, localName)* <div class="specs"><i>W3C</i></div> {#getNamedItemNS}

Returns a <code>Attr</code> identified by a namespace and related local name.

#### **Arguments**:


 - namespace `string`. Needs content.
 - localName `string`. Needs content.

#### **Returns**: `Promise<Attr>`

### .item*(index)* <div class="specs"><i>W3C</i></div> {#item}

Returns the <code>Attr</code> at the given index, or <code>null</code> if the index is higher or equal to the number of nodes.

#### **Arguments**:


 - index `number`. Needs content.

#### **Returns**: `Promise<Attr>`

## Unimplemented Specs

#### Methods

 |   |   | 
 | --- | --- | 
 | `removeNamedItem()` | `removeNamedItemNS()`
`setNamedItem()` | `setNamedItemNS()` | 
