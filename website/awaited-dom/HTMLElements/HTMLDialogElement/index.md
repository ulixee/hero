# HTMLDialogElement

<div class='overview'><strong>This is an <a href="/en-US/docs/MDN/Contribute/Guidelines/Conventions_definitions#Experimental">experimental technology</a></strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">open</a>
    <div>A <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/dialog#attr-open">open</a></code> HTML attribute, indicating whether the dialog is available for interaction.</div>
  </li>
  <li>
    <a href="">returnValue</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that sets or returns the return value for the dialog.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">close()</a>
    <div>Closes the dialog. An optional <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> may be passed as an argument, updating the <code>returnValue</code> of the the dialog.</div>
  </li>
  <li>
    <a href="">show()</a>
    <div>Displays the dialog modelessly, i.e. still allowing interaction with content outside of the dialog.</div>
  </li>
  <li>
    <a href="">showModal()</a>
    <div>Displays the dialog as a modal, over the top of any other dialogs that might be present. Interaction outside the dialog is blocked.</div>
  </li>
</ul>

## Events
