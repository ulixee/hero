# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLFormElement

<div class='overview'><span class="seoSummary">The <code><strong>HTMLFormElement</strong></code> interface represents a <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code></a> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements.</span></div>

## Properties

### .acceptCharset <div class="specs"><i>W3C</i></div> {#acceptCharset}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-accept-charset">accept-charset</a>
</code>&nbsp;HTML&nbsp;attribute, representing the character encoding that the server accepts.

#### **Type**: `null`

### .action <div class="specs"><i>W3C</i></div> {#action}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-action">action</a>
</code> HTML attribute, containing the URI&nbsp;of a program that processes the information submitted by the form.

#### **Type**: `null`

### .autocomplete <div class="specs"><i>W3C</i></div> {#autocomplete}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-autocomplete">autocomplete</a>
</code> HTML&nbsp;attribute, indicating whether the controls in this form can have their values automatically populated by the browser.

#### **Type**: `null`

### .elements <div class="specs"><i>W3C</i></div> {#elements}

A <a href="/en-US/docs/Web/API/HTMLFormControlsCollection" title="The HTMLFormControlsCollection interface represents a collection of HTML form control elements. "><code>HTMLFormControlsCollection</code>
</a> holding all form controls belonging to this form element.

#### **Type**: `null`

### .encoding <div class="specs"><i>W3C</i></div> {#encoding}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-enctype">enctype</a>
</code>&nbsp;HTML&nbsp;attribute, indicating the type of content that is used to transmit the form to the server. Only specified values can be set. The two properties are synonyms.

#### **Type**: `null`

### .enctype <div class="specs"><i>W3C</i></div> {#enctype}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-enctype">enctype</a>
</code>&nbsp;HTML&nbsp;attribute, indicating the type of content that is used to transmit the form to the server. Only specified values can be set. The two properties are synonyms.

#### **Type**: `null`

### .length <div class="specs"><i>W3C</i></div> {#length}

A <code>long
</code> reflecting&nbsp; the number of controls in the form.

#### **Type**: `null`

### .method <div class="specs"><i>W3C</i></div> {#method}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-method">method</a>
</code>&nbsp;HTML&nbsp;attribute, indicating the HTTP&nbsp;method used to submit the form. Only specified values can be set.

#### **Type**: `null`

### .name <div class="specs"><i>W3C</i></div> {#name}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-name">name</a>
</code>&nbsp;HTML&nbsp;attribute, containing the name of the form.

#### **Type**: `null`

### .noValidate <div class="specs"><i>W3C</i></div> {#noValidate}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> reflecting the value of the form's &nbsp;<code><a href="/en-US/docs/Web/HTML/Element/form#attr-novalidate">novalidate</a>
</code> HTML attribute, indicating whether the form should not be validated.

#### **Type**: `null`

### .target <div class="specs"><i>W3C</i></div> {#target}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form's <code><a href="/en-US/docs/Web/HTML/Element/form#attr-target">target</a>
</code> HTML attribute, indicating where to display the results received from submitting the form.

#### **Type**: `null`

## Methods

### .checkValidity*(...args)* <div class="specs"><i>W3C</i></div> {#checkValidity}

Returns <code>true</code> if the element's child controls are subject to <a href="/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation">constraint validation</a> and satisfy those contraints; returns <code>false</code> if some controls do not satisfy their constraints. Fires an event named <code><a href="/en-US/docs/Web/Events/invalid" title="/en-US/docs/Web/Events/invalid">invalid</a></code> at any control that does not satisfy its constraints; such controls are considered invalid if the event is not canceled. It is up to the programmer to decide how to respond to <code>false
</code>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .reportValidity*(...args)* <div class="specs"><i>W3C</i></div> {#reportValidity}

Returns <code>true</code> if the element's child controls satisfy their <a href="/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation">validation constraints</a>. When <code>false</code> is returned, cancelable <code><a href="/en-US/docs/Web/Events/invalid" title="/en-US/docs/Web/Events/invalid">invalid</a>
</code> events are fired for each invalid child and validation problems are reported to the user.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .requestSubmit*(...args)* <div class="specs"><i>W3C</i></div> {#requestSubmit}

Requests that the form be submitted using the specified submit button and its corresponding configuration.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .reset*(...args)* <div class="specs"><i>W3C</i></div> {#reset}

Resets the form to its initial state.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .submit*(...args)* <div class="specs"><i>W3C</i></div> {#submit}

Submits the form to the server.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
