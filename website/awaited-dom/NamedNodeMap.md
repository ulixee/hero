# NamedNodeMap

<div class='overview'>The <code><strong>NamedNodeMap</strong></code> interface represents a collection of <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> objects. Objects inside a <code>NamedNodeMap</code> are not in any particular order, unlike <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a>, although they may be accessed by an index as in an array.</div>

<div class='overview'>A <code>NamedNodeMap</code> object is <em>live</em> and will thus be auto-updated if changes are made to its contents internally or elsewhere.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns the amount of objects in the map.

#### **Type**: `SuperDocument`

## Methods

### .getNamedItem*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getNamedItem}

Returns a <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a>, corresponding to the given name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getNamedItemNS*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getNamedItemNS}

Returns a <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> identified by a namespace and related local name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .item*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#item}

Returns the <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> at the given index, or <code>null</code> if the index is higher or equal to the number of nodes.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .removeNamedItem*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#removeNamedItem}

Removes the <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> identified by the given map.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .removeNamedItemNS*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#removeNamedItemNS}

Removes the <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> identified by the given namespace and related local name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setNamedItem*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setNamedItem}

Replaces, or adds, the <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> identified in the map by the given name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setNamedItemNS*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setNamedItemNS}

Replaces, or adds, the <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> identified in the map by the given namespace and related local name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
