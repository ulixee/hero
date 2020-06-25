# HTMLParamElement

<div class='overview'>The <strong><code>HTMLParamElement</code></strong> interface provides special properties (beyond those of the regular <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> object interface it inherits) for manipulating <a href="/en-US/docs/Web/HTML/Element/param" title="The HTML <param> element defines parameters for an <object> element."><code>&lt;param&gt;</code></a> elements, representing a pair of a key and a value that acts as a parameter for an <a href="/en-US/docs/Web/HTML/Element/object" title="The HTML <object> element represents an external resource, which can be treated as an image, a nested browsing context, or a resource to be handled by a plugin."><code>&lt;object&gt;</code></a> element.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">name</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the name of the parameter. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/param#attr-name">name</a></code> attribute.</div>
  </li>
  <li>
    <a href="">type</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the type of the parameter when <code>valueType</code> has the <code>"ref"</code> value. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/param#attr-type">type</a></code> attribute.</div>
  </li>
  <li>
    <a href="">value</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the value associated to the parameter. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/param#attr-value">value</a></code> attribute.</div>
  </li>
  <li>
    <a href="">valueType</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the type of the <code>value</code>. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/param#attr-<code>valuetype</code>"><code>valuetype</code></a></code> attribute and has one of the values: <code>"data"</code>, <code>"ref"</code>, or <code>"object"</code>.</div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
