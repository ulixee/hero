# LinkStyle

<div class='overview'>The <code><strong>LinkStyle</strong></code> interface provides access to the <em>associated CSS style sheet</em> of a node.</div>

<div class='overview'><code>LinkStyle</code> is a raw interface and no object of this type can be created; it is implemented by <a href="/en-US/docs/Web/API/HTMLLinkElement" title="The HTMLLinkElement interface represents reference information for external resources and the relationship of those resources to a document and vice-versa (corresponds to <link> element; not to be confused with <a>, which is represented by HTMLAnchorElement). This object inherits all of the properties and methods of the HTMLElement interface."><code>HTMLLinkElement</code></a> and <a href="/en-US/docs/Web/API/HTMLStyleElement" title="The HTMLStyleElement interface represents a <style> element. It inherits properties and methods from its parent, HTMLElement, and from LinkStyle."><code>HTMLStyleElement</code></a> objects.</div>

## Properties

### .sheet <div class="specs"><i>W3C</i></div> {#sheet}

Returns the <a href="/en-US/docs/Web/API/CSSStyleSheet" title="The CSSStyleSheet interface represents a single CSS stylesheet, and lets you inspect and modify the list of rules contained in the stylesheet."><code>CSSStyleSheet</code></a> object associated with the given element, or <code>null</code> if there is none.

#### **Type**: `SuperDocument`

## Methods

## Events
