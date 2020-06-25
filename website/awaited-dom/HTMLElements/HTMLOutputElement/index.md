# HTMLOutputElement

<div class='overview'>The <strong><code>HTMLOutputElement</code></strong> interface provides properties and methods (beyond those inherited from <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a>) for manipulating the layout and presentation of <a href="/en-US/docs/Web/HTML/Element/output" title="The HTML Output element (<output>) is a container element into which a site or app can inject the results of a calculation or the outcome of a user action."><code>&lt;output&gt;</code></a> elements.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">defaultValue</a>
    <div>A&nbsp;<a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the default value of the element, initially the empty string.</div>
  </li>
  <li>
    <a href="">form</a>
    <div>An <a href="/en-US/docs/Web/API/HTMLFormElement" title="The HTMLFormElement interface represents a <form> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements."><code>HTMLFormElement</code></a> indicating the form associated with the control, reflecting the <code><a href="/en-US/docs/Web/HTML/Element/output#attr-form">form</a></code> HTML attribute if it is defined.</div>
  </li>
  <li>
    <a href="">htmlFor</a>
    <div>A <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/output#attr-for">for</a></code> HTML attribute, containing a list of IDs of other elements in the same document that contribute to (or otherwise affect) the calculated <code>value</code>.</div>
  </li>
  <li>
    <a href="">labels</a>
    <div>A <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> of <a href="/en-US/docs/Web/HTML/Element/label" title="The HTML <label> element represents a caption for an item in a user interface."><code>&lt;label&gt;</code></a> elements associated with the element.</div>
  </li>
  <li>
    <a href="">name</a>
    <div>A&nbsp;<a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/output#attr-name">name</a></code> HTML attribute, containing the name for the control that is submitted with form data.</div>
  </li>
  <li>
    <a href="">type</a>
    <div>The <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> <code>"output"</code>.</div>
  </li>
  <li>
    <a href="">validationMessage</a>
    <div>A&nbsp;<a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing a localized message that describes the validation constraints that the control does not satisfy (if any). This is the empty string if the control is not a candidate for constraint validation (<code>willValidate</code> is <code>false</code>), or it satisfies its constraints.</div>
  </li>
  <li>
    <a href="">validity</a>
    <div>A&nbsp;<a href="/en-US/docs/Web/API/ValidityState" title="The ValidityState interface represents the validity states that an element can be in, with respect to constraint validation. Together, they help explain why an element's value fails to validate, if it's not valid."><code>ValidityState</code></a> representing the validity states that this element is in.</div>
  </li>
  <li>
    <a href="">value</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the value of the contents of the elements. Behaves like the <a href="/en-US/docs/Web/API/Node/textContent" title="The textContent property of the Node interface represents the text content of the node and its descendants."><code>Node.textContent</code></a> property.</div>
  </li>
  <li>
    <a href="">willValidate</a>
    <div>A <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> indicating whether the element is a candidate for constraint validation.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">checkValidity()</a>
    <div>Checks the validity of the element and returns a <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> holding the check result.</div>
  </li>
  <li>
    <a href="">reportValidity()</a>
    <div>This method reports the problems with the constraints on the element, if any, to the user. If there are problems, fires an <a href="/en-US/docs/Web/Events/invalid">invalid</a> event at the element, and returns <code>false</code>; if there are no problems, it returns <code>true</code>.</div>
  </li>
  <li>
    <a href="">setCustomValidity()</a>
    <div>Sets a custom validity message for the element. If this message is not the empty string, then the element is suffering from a custom validity error, and does not validate.</div>
  </li>
</ul>

## Events
