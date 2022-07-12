# [AwaitedDOM](/docs/hero/basic-client/awaited-dom) <span>/</span> XPathNSResolver

<div class='overview'>The&nbsp;<code>XPathNSResolver</code> interface permits prefix strings in an XPath expression to be properly bound to namespace URI strings.</div>

<div class='overview'>The <code>XPathEvaluator</code> interface can construct an implementation of <code>XPathNSResolver</code> from a node, or the interface may be implemented by any application.</div>

## Methods

### .lookupNamespaceURI *(prefix)* <div class="specs"><i>W3C</i></div> {#lookupNamespaceURI}

Looks up the namespace URI associated to the given namespace prefix.

#### **Arguments**:


 - prefix `string`. A `string` representing the prefix to look for.

#### **Returns**: `Promise<string>`
