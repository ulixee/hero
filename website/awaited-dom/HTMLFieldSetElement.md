# HTMLFieldSetElement

<div class='overview'>The <strong><code>HTMLFieldSetElement</code></strong> interface provides special properties and methods (beyond the regular <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface it also has available to it by inheritance) for manipulating the layout and presentation of <a href="/en-US/docs/Web/HTML/Element/fieldset" title="The HTML <fieldset> element is used to group several controls as well as labels (<label>) within a web form."><code>&lt;fieldset&gt;</code></a> elements.</div>

## Properties

### .disabled <div class="specs"><i>W3C</i></div> {#disabled}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/fieldset#attr-disabled">disabled</a></code> HTML attribute, indicating whether the user can interact with the control.

#### **Type**: `SuperDocument`

### .elements <div class="specs"><i>W3C</i></div> {#elements}

The elements belonging to this field set. The type of this property depends on the version of the spec that is implemented by the browser.

#### **Type**: `SuperDocument`

### .form <div class="specs"><i>W3C</i></div> {#form}

An <a href="/en-US/docs/Web/API/HTMLFormControlsCollection" title="The HTMLFormControlsCollection interface represents a collection of HTML form control elements. "><code>HTMLFormControlsCollection</code></a> or <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> referencing the containing form element, if this element is in a form.<br>
 If the field set is not a descendant of a form element, then the attribute can be the ID of any form element in the same document it is related to, or the <code>null</code> value if none matches.

#### **Type**: `SuperDocument`

### .name <div class="specs"><i>W3C</i></div> {#name}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/fieldset#attr-name">name</a></code> HTML attribute, containing the name of the field set, used for submitting the form.

#### **Type**: `SuperDocument`

### .type <div class="specs"><i>W3C</i></div> {#type}

The <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> <code>"fieldset"</code>.

#### **Type**: `SuperDocument`

### .validationMessage <div class="specs"><i>W3C</i></div> {#validationMessage}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing a localized message that describes the validation constraints that the element does not satisfy (if any). This is the empty string if the element is not a candidate for constraint validation (<code>willValidate</code> is <code>false</code>), or it satisfies its constraints.

#### **Type**: `SuperDocument`

### .validity <div class="specs"><i>W3C</i></div> {#validity}

A <a href="/en-US/docs/Web/API/ValidityState" title="The ValidityState interface represents the validity states that an element can be in, with respect to constraint validation. Together, they help explain why an element's value fails to validate, if it's not valid."><code>ValidityState</code></a> representing the validity states that this element is in.

#### **Type**: `SuperDocument`

### .willValidate <div class="specs"><i>W3C</i></div> {#willValidate}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> <code>false</code>, because <a href="/en-US/docs/Web/HTML/Element/fieldset" title="The HTML <fieldset> element is used to group several controls as well as labels (<label>) within a web form."><code>&lt;fieldset&gt;</code></a> objects are never candidates for constraint validation.

#### **Type**: `SuperDocument`

## Methods

### .checkValidity*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#checkValidity}

Always returns <code>true</code> because <a href="/en-US/docs/Web/HTML/Element/fieldset" title="The HTML <fieldset> element is used to group several controls as well as labels (<label>) within a web form."><code>&lt;fieldset&gt;</code></a> objects are never candidates for constraint validation.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .reportValidity*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#reportValidity}

Always returns <code>true</code> because <a href="/en-US/docs/Web/HTML/Element/fieldset" title="The HTML <fieldset> element is used to group several controls as well as labels (<label>) within a web form."><code>&lt;fieldset&gt;</code></a> objects are never candidates for constraint validation.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .setCustomValidity*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#setCustomValidity}

Sets a custom validity message for the field set. If this message is not the empty string, then the field set is suffering from a custom validity error, and does not validate.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
