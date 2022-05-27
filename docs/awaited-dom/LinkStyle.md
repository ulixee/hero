# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> LinkStyle

<div class='overview'>The <code><strong>LinkStyle</strong></code> interface provides access to the <em>associated CSS style sheet</em> of a node.</div>

<div class='overview'><code>LinkStyle</code> is a raw interface and no object of this type can be created; it is implemented by <code>HTMLLinkElement</code> and <code>HTMLStyleElement</code> objects.</div>

## Properties

### .sheet <div class="specs"><i>W3C</i></div> {#sheet}

Returns the <code>CSSStyleSheet</code> object associated with the given element, or <code>null</code> if there is none.

#### **Type**: [`SuperStyleSheet`](/docs/awaited-dom/super-style-sheet)
