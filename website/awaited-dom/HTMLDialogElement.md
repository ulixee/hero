# HTMLDialogElement

<div class='overview'><strong>This is an <a href="/en-US/docs/MDN/Contribute/Guidelines/Conventions_definitions#Experimental">experimental technology</a></strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

### .open <div class="specs"><i>W3C</i></div> {#open}

A <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/dialog#attr-open">open</a></code> HTML attribute, indicating whether the dialog is available for interaction.

#### **Type**: `SuperDocument`

### .returnValue <div class="specs"><i>W3C</i></div> {#returnValue}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that sets or returns the return value for the dialog.

#### **Type**: `SuperDocument`

## Methods

### .close*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#close}

Closes the dialog. An optional <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> may be passed as an argument, updating the <code>returnValue</code> of the the dialog.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .show*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#show}

Displays the dialog modelessly, i.e. still allowing interaction with content outside of the dialog.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .showModal*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#showModal}

Displays the dialog as a modal, over the top of any other dialogs that might be present. Interaction outside the dialog is blocked.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
