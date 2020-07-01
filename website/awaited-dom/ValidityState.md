# ValidityState

<div class='overview'>The <strong><code>ValidityState</code></strong> interface represents the <em>validity states</em> that an element can be in, with respect to constraint validation. Together, they help explain why an element's value fails to validate, if it's not valid.</div>

## Properties

### .badInput <div class="specs"><i>W3C</i></div> {#badInput}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>true</code> if the user has provided input that the browser is unable to convert.

#### **Type**: `SuperDocument`

### .customError <div class="specs"><i>W3C</i></div> {#customError}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> indicating whether the element's custom validity message has been set to a non-empty string by calling the element's <a href="/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity" title="The setCustomValidity() method of the HTMLObjectElement interface sets a custom validity message for the element."><code>setCustomValidity()</code></a> method.

#### **Type**: `SuperDocument`

### .patternMismatch <div class="specs"><i>W3C</i></div> {#patternMismatch}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>true</code> if the value does not match the specified <code><a href="/en-US/docs/Web/HTML/Element/input#attr-pattern">pattern</a></code>, and <code>false</code> if it does match. If true, the element matches the <a href="/en-US/docs/Web/CSS/:invalid" title="The :invalid CSS pseudo-class represents any <input> or other <form> element whose contents fail to validate."><code>:invalid</code></a> CSS pseudo-class.

#### **Type**: `SuperDocument`

### .rangeOverflow <div class="specs"><i>W3C</i></div> {#rangeOverflow}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is true if the value is greater than the maximum specified by the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-max">max</a></code> attribute, or <code>false</code> if it is less than or equal to the maximum. If true, the element matches the <a href="/en-US/docs/Web/CSS/:invalid" title="The :invalid CSS pseudo-class represents any <input> or other <form> element whose contents fail to validate."><code>:invalid</code></a> and <a href="/en-US/docs/Web/CSS/:out-of-range" title="The :out-of-range CSS pseudo-class represents an <input> element whose current value is outside the range limits specified by the min and max attributes."><code>:out-of-range</code></a> and CSS pseudo-classes.

#### **Type**: `SuperDocument`

### .rangeUnderflow <div class="specs"><i>W3C</i></div> {#rangeUnderflow}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>true</code> if the value is less than the minimum specified by the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-min">min</a></code> attribute, or <code>false</code> if it is greater than or equal to the minimum. If true, the element matches the <a href="/en-US/docs/Web/CSS/:invalid" title="The :invalid CSS pseudo-class represents any <input> or other <form> element whose contents fail to validate."><code>:invalid</code></a> and <a href="/en-US/docs/Web/CSS/:out-of-range" title="The :out-of-range CSS pseudo-class represents an <input> element whose current value is outside the range limits specified by the min and max attributes."><code>:out-of-range</code></a> CSS pseudo-classes.

#### **Type**: `SuperDocument`

### .stepMismatch <div class="specs"><i>W3C</i></div> {#stepMismatch}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>true</code> if the value does not fit the rules determined by the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-step">step</a></code> attribute (that is, it's not evenly divisible by the step value), or <code>false</code> if it does fit the step rule. If true, the element matches the <a href="/en-US/docs/Web/CSS/:invalid" title="The :invalid CSS pseudo-class represents any <input> or other <form> element whose contents fail to validate."><code>:invalid</code></a> and <a href="/en-US/docs/Web/CSS/:out-of-range" title="The :out-of-range CSS pseudo-class represents an <input> element whose current value is outside the range limits specified by the min and max attributes."><code>:out-of-range</code></a> CSS pseudo-classes.

#### **Type**: `SuperDocument`

### .tooLong <div class="specs"><i>W3C</i></div> {#tooLong}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>true</code> if the value exceeds the specified <code>maxlength</code> for <a href="/en-US/docs/Web/API/HTMLInputElement" title="The HTMLInputElement interface provides special properties and methods for manipulating the options, layout, and presentation of <input> elements."><code>HTMLInputElement</code></a> or <a href="/en-US/docs/Web/API/HTMLTextAreaElement" title="The HTMLTextAreaElement interface provides special properties and methods for manipulating the layout and presentation of <textarea> elements."><code>HTMLTextAreaElement</code></a> objects, or false if its length is less than or equal to the maximum length. <em><strong>Note:</strong> This property is never <code>true</code> in Gecko, because elements' values are prevented from being longer than <code>maxlength</code>. </em>If true, the element matches the the <a href="/en-US/docs/Web/CSS/:invalid" title="The :invalid CSS pseudo-class represents any <input> or other <form> element whose contents fail to validate."><code>:invalid</code></a> and <a href="/en-US/docs/Web/CSS/:out-of-range" title="The :out-of-range CSS pseudo-class represents an <input> element whose current value is outside the range limits specified by the min and max attributes."><code>:out-of-range</code></a> CSS pseudo-classes.

#### **Type**: `SuperDocument`

### .tooShort <div class="specs"><i>W3C</i></div> {#tooShort}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>true</code> if the value fails to meet&nbsp;the specified <code>minlength</code> for <a href="/en-US/docs/Web/API/HTMLInputElement" title="The HTMLInputElement interface provides special properties and methods for manipulating the options, layout, and presentation of <input> elements."><code>HTMLInputElement</code></a> or <a href="/en-US/docs/Web/API/HTMLTextAreaElement" title="The HTMLTextAreaElement interface provides special properties and methods for manipulating the layout and presentation of <textarea> elements."><code>HTMLTextAreaElement</code></a> objects, or <code>false</code> if its length is greater than or equal to the minimum length. If true, the element matches the <a href="/en-US/docs/Web/CSS/:invalid" title="The :invalid CSS pseudo-class represents any <input> or other <form> element whose contents fail to validate."><code>:invalid</code></a> and <a href="/en-US/docs/Web/CSS/:out-of-range" title="The :out-of-range CSS pseudo-class represents an <input> element whose current value is outside the range limits specified by the min and max attributes."><code>:out-of-range</code></a> CSS pseudo-classes.

#### **Type**: `SuperDocument`

### .typeMismatch <div class="specs"><i>W3C</i></div> {#typeMismatch}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>true</code> if the value is not in the required syntax (when <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>email</code> or <code>url</code>), or <code>false</code> if the syntax is correct. If true, the element matches the <a href="/en-US/docs/Web/CSS/:invalid" title="The :invalid CSS pseudo-class represents any <input> or other <form> element whose contents fail to validate."><code>:invalid</code></a> CSS pseudo-class.

#### **Type**: `SuperDocument`

### .valid <div class="specs"><i>W3C</i></div> {#valid}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>true</code> if the element meets all its validation constraints, and is therefore considered to be valid, or <code>false</code> if it fails any constraint. If true, the element matches the <a href="/en-US/docs/Web/CSS/:valid" title="The :valid CSS pseudo-class represents any <input> or other <form> element whose contents validate successfully. This allows to easily make valid fields adopt an appearance that helps the user confirm that their data is formatted properly."><code>:valid</code></a> CSS pseudo-class; the <a href="/en-US/docs/Web/CSS/:invalid" title="The :invalid CSS pseudo-class represents any <input> or other <form> element whose contents fail to validate."><code>:invalid</code></a> CSS pseudo-class otherwise.

#### **Type**: `SuperDocument`

### .valueMissing <div class="specs"><i>W3C</i></div> {#valueMissing}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>true</code> if the element has a <code><a href="/en-US/docs/Web/HTML/Element/input#attr-required">required</a></code> attribute, but no value, or <code>false</code> otherwise. If true, the element matches the <a href="/en-US/docs/Web/CSS/:invalid" title="The :invalid CSS pseudo-class represents any <input> or other <form> element whose contents fail to validate."><code>:invalid</code></a> CSS pseudo-class.

#### **Type**: `SuperDocument`

## Methods

## Events
