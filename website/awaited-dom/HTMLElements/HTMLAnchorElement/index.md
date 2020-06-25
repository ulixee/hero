# HTMLAnchorElement

<div class='overview'>The <strong><code>HTMLAnchorElement</code></strong> interface represents hyperlink elements and provides special properties and methods (beyond those of the regular <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> object interface that they inherit from) for manipulating the layout and presentation of such elements. This interface corresponds to <code><a href="/en-US/docs/Web/HTML/Element/a">&lt;a&gt;</a></code> element; not to be confused with <code><a href="/en-US/docs/Web/HTML/Element/link">&lt;link&gt;</a></code>, which is represented by <code><a href="/en-US/docs/Web/API/HTMLLinkElement">HTMLLinkElement</a></code>)</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">download</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> indicating that the linked resource is intended to be downloaded rather than displayed in the browser. The value represent the proposed name of the file. If the name is not a valid filename of the underlying OS, browser will adapt it.</div>
  </li>
  <li>
    <a href="">hreflang</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-hreflang">hreflang</a></code> HTML attribute, indicating the language of the linked resource.</div>
  </li>
  <li>
    <a href="">referrerPolicy</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-referrerpolicy">referrerpolicy</a></code> HTML attribute indicating which referrer to use.</div>
  </li>
  <li>
    <a href="">rel</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-rel">rel</a></code> HTML attribute, specifying the relationship of the target object to the linked object.</div>
  </li>
  <li>
    <a href="">relList</a>
    <div>Returns a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-rel">rel</a></code> HTML attribute, as a list of tokens.</div>
  </li>
  <li>
    <a href="">target</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-target">target</a></code> HTML attribute, indicating where to display the linked resource.</div>
  </li>
  <li>
    <a href="">text</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> being a synonym for the <a href="/en-US/docs/Web/API/Node/textContent" title="The textContent property of the Node interface represents the text content of the node and its descendants."><code>Node.textContent</code></a> property.</div>
  </li>
  <li>
    <a href="">type</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/a#attr-type">type</a></code> HTML attribute, indicating the MIME type of the linked resource.</div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
