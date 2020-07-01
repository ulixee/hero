# HTMLAnchorElement

<div class='overview'>The <strong><code>HTMLAnchorElement</code></strong> interface represents hyperlink elements and provides special properties and methods (beyond those of the regular <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> object interface that they inherit from) for manipulating the layout and presentation of such elements. This interface corresponds to <code><a href="/en-US/docs/Web/HTML/Element/a">&lt;a&gt;</a></code> element; not to be confused with <code><a href="/en-US/docs/Web/HTML/Element/link">&lt;link&gt;</a></code>, which is represented by <code><a href="/en-US/docs/Web/API/HTMLLinkElement">HTMLLinkElement</a></code>)</div>

## Properties

### .download <div class="specs"><i>W3C</i></div> {#download}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> indicating that the linked resource is intended to be downloaded rather than displayed in the browser. The value represent the proposed name of the file. If the name is not a valid filename of the underlying OS, browser will adapt it.

#### **Type**: `SuperDocument`

### .hreflang <div class="specs"><i>W3C</i></div> {#hreflang}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-hreflang">hreflang</a></code> HTML attribute, indicating the language of the linked resource.

#### **Type**: `SuperDocument`

### .referrerPolicy <div class="specs"><i>W3C</i></div> {#referrerPolicy}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-referrerpolicy">referrerpolicy</a></code> HTML attribute indicating which referrer to use.

#### **Type**: `SuperDocument`

### .rel <div class="specs"><i>W3C</i></div> {#rel}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-rel">rel</a></code> HTML attribute, specifying the relationship of the target object to the linked object.

#### **Type**: `SuperDocument`

### .relList <div class="specs"><i>W3C</i></div> {#relList}

Returns a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-rel">rel</a></code> HTML attribute, as a list of tokens.

#### **Type**: `SuperDocument`

### .target <div class="specs"><i>W3C</i></div> {#target}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-target">target</a></code> HTML attribute, indicating where to display the linked resource.

#### **Type**: `SuperDocument`

### .text <div class="specs"><i>W3C</i></div> {#text}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> being a synonym for the <a href="/en-US/docs/Web/API/Node/textContent" title="The textContent property of the Node interface represents the text content of the node and its descendants."><code>Node.textContent</code></a> property.

#### **Type**: `SuperDocument`

### .type <div class="specs"><i>W3C</i></div> {#type}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-type">type</a></code> HTML attribute, indicating the MIME type of the linked resource.

#### **Type**: `SuperDocument`

## Methods

## Events
