# HTMLLIElement

<div class='overview'>The <strong><code>HTMLLIElement</code></strong> interface exposes specific properties and methods (beyond those defined by regular <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface it also has available to it by inheritance) for manipulating list elements.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">type</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the type of the bullets, <code>"disc"</code>, <code>"square"</code> or <code>"circle"</code>. As the standard way of defining the list type is via the CSS <a href="/en-US/docs/Web/CSS/list-style-type" title="The list-style-type CSS property sets the marker (such as a disc, character, or custom counter style) of a list item element."><code>list-style-type</code></a> property, use the CSSOM methods to set it via a script.</div>
  </li>
  <li>
    <a href="">value</a>
    <div>Is a <code>long</code> indicating the ordinal position of the <em>list element</em> inside a given <a href="/en-US/docs/Web/HTML/Element/ol" title="The HTML <ol> element represents an ordered list of items — typically rendered as a numbered list."><code>&lt;ol&gt;</code></a>. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/li#attr-value">value</a></code> attribute of the HTML <a href="/en-US/docs/Web/HTML/Element/li" title="The HTML <li> element is used to represent an item in a list."><code>&lt;li&gt;</code></a> element, and can be smaller than <code>0</code>. If the <a href="/en-US/docs/Web/HTML/Element/li" title="The HTML <li> element is used to represent an item in a list."><code>&lt;li&gt;</code></a> element is not a child of an <a href="/en-US/docs/Web/HTML/Element/ol" title="The HTML <ol> element represents an ordered list of items — typically rendered as a numbered list."><code>&lt;ol&gt;</code></a> element, the property has no meaning.</div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
