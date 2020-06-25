# HTMLFormElement

<div class='overview'><span class="seoSummary">The <code><strong>HTMLFormElement</strong></code> interface represents a <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code></a> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements.</span></div>

## Properties

<ul class="items properties">
  <li>
    <a href="">acceptCharset</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-accept-charset">accept-charset</a></code>&nbsp;HTML&nbsp;attribute, representing the character encoding that the server accepts.</div>
  </li>
  <li>
    <a href="">action</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-action">action</a></code> HTML attribute, containing the URI&nbsp;of a program that processes the information submitted by the form.</div>
  </li>
  <li>
    <a href="">autocomplete</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-autocomplete">autocomplete</a></code> HTML&nbsp;attribute, indicating whether the controls in this form can have their values automatically populated by the browser.</div>
  </li>
  <li>
    <a href="">elements</a>
    <div>A <a href="/en-US/docs/Web/API/HTMLFormControlsCollection" title="The HTMLFormControlsCollection interface represents a collection of HTML form control elements. "><code>HTMLFormControlsCollection</code></a> holding all form controls belonging to this form element.</div>
  </li>
  <li>
    <a href="">encoding</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-enctype">enctype</a></code>&nbsp;HTML&nbsp;attribute, indicating the type of content that is used to transmit the form to the server. Only specified values can be set. The two properties are synonyms.</div>
  </li>
  <li>
    <a href="">enctype</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-enctype">enctype</a></code>&nbsp;HTML&nbsp;attribute, indicating the type of content that is used to transmit the form to the server. Only specified values can be set. The two properties are synonyms.</div>
  </li>
  <li>
    <a href="">length</a>
    <div>A <code>long</code> reflecting&nbsp; the number of controls in the form.</div>
  </li>
  <li>
    <a href="">method</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-method">method</a></code>&nbsp;HTML&nbsp;attribute, indicating the HTTP&nbsp;method used to submit the form. Only specified values can be set.</div>
  </li>
  <li>
    <a href="">name</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-name">name</a></code>&nbsp;HTML&nbsp;attribute, containing the name of the form.</div>
  </li>
  <li>
    <a href="">noValidate</a>
    <div>A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> reflecting the value of the form's &nbsp;<code><a href="/en-US/docs/Web/HTML/Element/form#attr-novalidate">novalidate</a></code> HTML attribute, indicating whether the form should not be validated.</div>
  </li>
  <li>
    <a href="">target</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-target">target</a></code> HTML attribute, indicating where to display the results received from submitting the form.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">checkValidity()</a>
    <div>Returns <code>true</code> if the element's child controls are subject to <a href="/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation">constraint validation</a> and satisfy those contraints; returns <code>false</code> if some controls do not satisfy their constraints. Fires an event named <code><a href="/en-US/docs/Web/Events/invalid" title="/en-US/docs/Web/Events/invalid">invalid</a></code> at any control that does not satisfy its constraints; such controls are considered invalid if the event is not canceled. It is up to the programmer to decide how to respond to <code>false</code>.</div>
  </li>
  <li>
    <a href="">reportValidity()</a>
    <div>Returns <code>true</code> if the element's child controls satisfy their <a href="/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation">validation constraints</a>. When <code>false</code> is returned, cancelable <code><a href="/en-US/docs/Web/Events/invalid" title="/en-US/docs/Web/Events/invalid">invalid</a></code> events are fired for each invalid child and validation problems are reported to the user.</div>
  </li>
  <li>
    <a href="">requestSubmit()</a>
    <div>Requests that the form be submitted using the specified submit button and its corresponding configuration.</div>
  </li>
  <li>
    <a href="">reset()</a>
    <div>Resets the form to its initial state.</div>
  </li>
  <li>
    <a href="">submit()</a>
    <div>Submits the form to the server.</div>
  </li>
</ul>

## Events
