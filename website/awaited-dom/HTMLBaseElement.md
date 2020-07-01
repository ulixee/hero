# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLBaseElement

<div class='overview'>The <strong><code>HTMLBaseElement</code></strong> interface contains the base URI&nbsp;for a document. This object inherits all of the properties and methods as described in the <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface.</div>

## Properties

### .href <div class="specs"><i>W3C</i></div> {#href}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/base#attr-href">href</a>
</code> HTML attribute, containing a base URL for relative URLs in the document.

#### **Type**: `null`

### .target <div class="specs"><i>W3C</i></div> {#target}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/base#attr-target">target</a>
</code> HTML attribute, containing a default target browsing context or frame for elements that do not have a target reference specified.

#### **Type**: `null`
