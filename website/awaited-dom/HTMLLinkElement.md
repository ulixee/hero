# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLLinkElement

<div class='overview'>The <strong><code>HTMLLinkElement</code></strong> interface represents reference information for external resources and the relationship of those resources to a document and vice-versa (corresponds to <code><a href="/en-US/docs/Web/HTML/Element/link">&lt;link&gt;</a></code> element; not to be confused with <code><a href="/en-US/docs/Web/HTML/Element/a">&lt;a&gt;</a></code>, which is represented by <code><a href="/en-US/docs/Web/API/HTMLAnchorElement">HTMLAnchorElement</a></code>). This object inherits all of the properties and methods of the <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface.</div>

## Properties

### .as <div class="specs"><i>W3C</i></div> {#as}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the type of content being loaded by the HTML link.

#### **Type**: `null`

### .crossOrigin <div class="specs"><i>W3C</i></div> {#crossOrigin}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that corresponds to the CORS setting for this link element. See <a href="/en-US/docs/HTML/CORS_settings_attributes" title="HTML/CORS settings attributes">CORS&nbsp;settings attributes
</a> for details.

#### **Type**: `null`

### .href <div class="specs"><i>W3C</i></div> {#href}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the URI&nbsp;for the target resource.

#### **Type**: `null`

### .hreflang <div class="specs"><i>W3C</i></div> {#hreflang}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing&nbsp;the language code for the linked resource.

#### **Type**: `null`

### .media <div class="specs"><i>W3C</i></div> {#media}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing a list of one or more media formats to which the resource applies.

#### **Type**: `null`

### .referrerPolicy <div class="specs"><i>W3C</i></div> {#referrerPolicy}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/link#attr-referrerpolicy">referrerpolicy</a>
</code> HTML attribute indicating which referrer to use.

#### **Type**: `null`

### .rel <div class="specs"><i>W3C</i></div> {#rel}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing&nbsp;the forward relationship of the linked resource from the document to the resource.

#### **Type**: `null`

### .relList <div class="specs"><i>W3C</i></div> {#relList}

Is a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/link#attr-rel">rel</a>
</code> HTML attribute, as a list of tokens.

#### **Type**: `null`

### .sizes <div class="specs"><i>W3C</i></div> {#sizes}

Is a <a class="new" href="/en-US/docs/Web/API/DOMSettableTokenList" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>DOMSettableTokenList</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/link#attr-sizes">sizes</a>
</code> HTML attribute, as a list of tokens.

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing&nbsp;the MIME type of the linked resource.

#### **Type**: `null`
