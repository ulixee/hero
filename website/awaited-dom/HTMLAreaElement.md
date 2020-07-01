# HTMLAreaElement

<div class='overview'>The <strong><code>HTMLAreaElement</code></strong> interface provides special properties and methods (beyond those of the regular object <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface it also has available to it by inheritance) for manipulating the layout and presentation of <a href="/en-US/docs/Web/HTML/Element/area" title="The HTML <area> element defines a hot-spot region on an image, and optionally associates it with a hypertext link. This element is used only within a <map> element."><code>&lt;area&gt;</code></a> elements.</div>

## Properties

### .alt <div class="specs"><i>W3C</i></div> {#alt}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/area#attr-alt">alt</a></code> HTML attribute, containing alternative text for the element.

#### **Type**: `null`

### .coords <div class="specs"><i>W3C</i></div> {#coords}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/area#attr-coords">coords</a></code> HTML attribute, containing coordinates to define the hot-spot region.

#### **Type**: `null`

### .download <div class="specs"><i>W3C</i></div> {#download}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> indicating that the linked resource is intended to be downloaded rather than displayed in the browser. The value represent the proposed name of the file. If the name is not a valid filename of the underlying OS, browser will adapt it.

#### **Type**: `null`

### .hreflang <div class="specs"><i>W3C</i></div> {#hreflang}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing that reflects the <code><a href="/en-US/docs/Web/HTML/Element/area#attr-hreflang">hreflang</a></code> HTML attribute, indicating the language of the linked resource.

#### **Type**: `null`

### .noHref <div class="specs"><i>W3C</i></div> {#noHref}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> flag indicating if the area is inactive (<code>true</code>) or active (<code>false</code>).

#### **Type**: `null`

### .referrerPolicy <div class="specs"><i>W3C</i></div> {#referrerPolicy}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/area#attr-referrerpolicy">referrerpolicy</a></code> HTML attribute indicating which referrer to use when fetching the linked resource.

#### **Type**: `null`

### .rel <div class="specs"><i>W3C</i></div> {#rel}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/area#attr-rel">rel</a></code> HTML attribute, indicating relationships of the current document to the linked resource.

#### **Type**: `null`

### .relList <div class="specs"><i>W3C</i></div> {#relList}

Returns a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/area#attr-rel">rel</a></code> HTML attribute, indicating relationships of the current document to the linked resource, as a list of tokens.

#### **Type**: `null`

### .shape <div class="specs"><i>W3C</i></div> {#shape}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/area#attr-shape">shape</a></code> HTML attribute, indicating the shape of the hot-spot, limited to known values.

#### **Type**: `null`

### .target <div class="specs"><i>W3C</i></div> {#target}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/area#attr-target">target</a></code> HTML attribute, indicating the browsing context in which to open the linked resource.

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/area#attr-type">type</a></code> HTML attribute, indicating the MIME type of the linked resource.

#### **Type**: `null`

## Methods

## Events
