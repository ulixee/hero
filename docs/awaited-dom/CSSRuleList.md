# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> CSSRuleList

<div class='overview'>A <code>CSSRuleList</code> is an (indirect-modify only) array-like object containing an ordered collection of <code>CSSRule</code> objects.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns the number of items in the collection.

#### **Type**: `Promise<number>`

## Methods

### .item *(index)* <div class="specs"><i>W3C</i></div> {#item}

Returns the specific node at the given zero-based index into the list. Returns null if the index is out of range.

#### **Arguments**:


 - index `number`. Needs content.

#### **Returns**: [`CSSRule`](/docs/awaited-dom/css-rule)
