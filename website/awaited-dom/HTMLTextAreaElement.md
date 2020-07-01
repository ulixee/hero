# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLTextAreaElement

<div class='overview'>The <strong><code>HTMLTextAreaElement</code></strong> interface provides special properties and methods for manipulating the layout and presentation of <a href="/en-US/docs/Web/HTML/Element/textarea" title="The HTML <textarea> element represents a multi-line plain-text editing control, useful when you want to allow users to enter a sizeable amount of free-form text, for example a comment on a review or feedback form."><code>&lt;textarea&gt;</code></a> elements.</div>

## Properties

### .autocomplete <div class="specs"><i>W3C</i></div> {#autocomplete}

Needs content.

#### **Type**: `null`

### .autofocus <div class="specs"><i>W3C</i></div> {#autofocus}

<code><em>boolean</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-autofocus">autofocus</a>
</code> attribute, indicating that the control should have input focus when the page loads

#### **Type**: `null`

### .cols <div class="specs"><i>W3C</i></div> {#cols}

<code><em>unsigned long</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-cols">cols</a>
</code> attribute, indicating the visible width of the text area.

#### **Type**: `null`

### .defaultValue <div class="specs"><i>W3C</i></div> {#defaultValue}

<code><em>string</em>:</code> Returns / Sets the control's default value, which behaves like the <a href="/en-US/docs/Web/API/Node/textContent" title="The textContent property of the Node interface represents the text content of the node and its descendants."><code>Node.textContent</code>
</a> property.

#### **Type**: `null`

### .disabled <div class="specs"><i>W3C</i></div> {#disabled}

<code><em>boolean</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-disabled">disabled</a>
</code> attribute, indicating that the control is not available for interaction.

#### **Type**: `null`

### .form <div class="specs"><i>W3C</i></div> {#form}

<code><em>object</em>:</code> Returns a reference to the parent form element. If this element is not contained in a form element, it can be the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-id">id</a></code> attribute of any <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code></a> element in the same document or the value <code>null
</code>.

#### **Type**: `null`

### .inputMode <div class="specs"><i>W3C</i></div> {#inputMode}

Needs content.

#### **Type**: `null`

### .labels <div class="specs"><i>W3C</i></div> {#labels}

<a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code>
</a>: Returns a list of label elements associated with this select element.

#### **Type**: `null`

### .maxLength <div class="specs"><i>W3C</i></div> {#maxLength}

<code><em>long</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-maxlength">maxlength</a>
</code> attribute, indicating the maximum number of characters the user can enter. This constraint is evaluated only when the value changes.

#### **Type**: `null`

### .minLength <div class="specs"><i>W3C</i></div> {#minLength}

<code><em>long</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-minlength">minlength</a>
</code> attribute, indicating the minimum number of characters the user can enter. This constraint is evaluated only when the value changes.

#### **Type**: `null`

### .name <div class="specs"><i>W3C</i></div> {#name}

<code><em>string</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-name">name</a>
</code> attribute, containing the name of the control.

#### **Type**: `null`

### .placeholder <div class="specs"><i>W3C</i></div> {#placeholder}

<code><em>string</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-placeholder">placeholder</a>
</code> attribute, containing a hint to the user about what to enter in the control.

#### **Type**: `null`

### .readOnly <div class="specs"><i>W3C</i></div> {#readOnly}

<code><em>boolean</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-readonly">readonly</a>
</code> attribute, indicating that the user cannot modify the value of the control.

#### **Type**: `null`

### .required <div class="specs"><i>W3C</i></div> {#required}

<code><em>boolean</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-required">required</a>
</code> attribute, indicating that the user must specify a value before submitting the form.

#### **Type**: `null`

### .rows <div class="specs"><i>W3C</i></div> {#rows}

<code><em>unsigned long</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-rows">rows</a>
</code> attribute, indicating the number of visible text lines for the control.

#### **Type**: `null`

### .selectionDirection <div class="specs"><i>W3C</i></div> {#selectionDirection}

<code><em>string</em>:</code> Returns / Sets the direction in which selection occurred. This is <code>"forward"</code> if selection was performed in the start-to-end direction of the current locale, or <code>"backward"</code> for the opposite direction. This can also be <code>"none"
</code> if the direction is unknown."

#### **Type**: `null`

### .selectionEnd <div class="specs"><i>W3C</i></div> {#selectionEnd}

<code><em>unsigned long</em>:</code> Returns / Sets the index of the end of selected text. If no text is selected, contains the index of the character that follows the input cursor. On being set, the control behaves as if <code>setSelectionRange()</code> had been called with this as the second argument, and <code>selectionStart
</code> as the first argument.

#### **Type**: `null`

### .selectionStart <div class="specs"><i>W3C</i></div> {#selectionStart}

<code><em>unsigned long</em>:</code> Returns / Sets the index of the beginning of selected text. If no text is selected, contains the index of the character that follows the input cursor. On being set, the control behaves as if <code>setSelectionRange()</code> had been called with this as the first argument, and <code>selectionEnd
</code> as the second argument.

#### **Type**: `null`

### .textLength <div class="specs"><i>W3C</i></div> {#textLength}

<code><em>long</em>:</code> Returns the codepoint length of the control's <code>value</code>. Same as <code>calling value.length
</code>

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

<code><em>string</em>:</code> Returns the string <code>textarea
</code>.

#### **Type**: `null`

### .validationMessage <div class="specs"><i>W3C</i></div> {#validationMessage}

<code><em>string</em>:</code> Returns a localized message that describes the validation constraints that the control does not satisfy (if any). This is the empty string if the control is not a candidate for constraint validation (<code>willValidate</code> is <code>false
</code>), or it satisfies its constraints.

#### **Type**: `null`

### .validity <div class="specs"><i>W3C</i></div> {#validity}

<code><em><a href="/en-US/docs/Web/API/ValidityState" title="The ValidityState interface represents the validity states that an element can be in, with respect to constraint validation. Together, they help explain why an element's value fails to validate, if it's not valid."><code>ValidityState</code></a> object</em>:
</code> Returns the validity states that this element is in.

#### **Type**: `null`

### .value <div class="specs"><i>W3C</i></div> {#value}

<code><em>string</em>:
</code> Returns / Sets the raw value contained in the control.

#### **Type**: `null`

### .willValidate <div class="specs"><i>W3C</i></div> {#willValidate}

<p><code><em>boolean</em>:</code> Returns whether the element is a candidate for constraint validation. <code>false</code> if any conditions bar it from constraint validation, including its <code>readOnly</code> or <code>disabled</code> property is <code>true</code>.
</p>

#### **Type**: `null`

### .wrap <div class="specs"><i>W3C</i></div> {#wrap}

<code><em>string</em>:</code> Returns / Sets the <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-wrap">wrap</a>
</code> HTML attribute, indicating how the control wraps text.

#### **Type**: `null`

## Methods

### .checkValidity*(...args)* <div class="specs"><i>W3C</i></div> {#checkValidity}

Returns <code>false</code> if the button is a candidate for constraint validation, and it does not satisfy its constraints. In this case, it also fires a cancelable <code>invalid</code> event at the control. It returns <code>true
</code> if the control is not a candidate for constraint validation, or if it satisfies its constraints.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .reportValidity*(...args)* <div class="specs"><i>W3C</i></div> {#reportValidity}

<p>This method reports the problems with the constraints on the element, if any, to the user. If there are problems, it fires a cancelable <code>invalid</code> event at the element, and returns <code>false</code>; if there are no problems, it returns <code>true</code>.
</p>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .select*(...args)* <div class="specs"><i>W3C</i></div> {#select}

Selects the contents of the control.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setCustomValidity*(...args)* <div class="specs"><i>W3C</i></div> {#setCustomValidity}

Sets a custom validity message for the element. If this message is not the empty string, then the element is suffering from a custom validity error, and does not validate.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setRangeText*(...args)* <div class="specs"><i>W3C</i></div> {#setRangeText}

Replaces a range of text in the element with new text.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setSelectionRange*(...args)* <div class="specs"><i>W3C</i></div> {#setSelectionRange}

Selects a range of text in the element (but does not focus it).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
