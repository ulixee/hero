# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLInputElement

<div class='overview'>The <strong><code>HTMLInputElement</code></strong> interface provides special properties and methods for manipulating the options, layout, and presentation of <a href="/en-US/docs/Web/HTML/Element/input" title="The HTML <input> element is used to create interactive controls for web-based forms in order to accept data from the user; a wide variety of types of input data and control widgets are available, depending on the device and user agent. "><code>&lt;input&gt;</code></a> elements.</div>

## Properties

### .accept <div class="specs"><i>W3C</i></div> {#accept}

<em><code>string</code>: </em><strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-accept">accept</a></code> attribute, containing comma-separated list of file types accepted by the server when <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>file
</code>.

#### **Type**: `null`

### .alt <div class="specs"><i>W3C</i></div> {#alt}

<em><code>string</code>: </em><strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-alt">alt</a></code> attribute, containing alternative text to use when <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>image.
</code>

#### **Type**: `null`

### .autocomplete <div class="specs"><i>W3C</i></div> {#autocomplete}

<p><em><code>string</code>: </em><strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-autocomplete">autocomplete</a></code> attribute, indicating whether the value of the control can be automatically completed by the browser.
</p>
			<p>Ignored if the value of the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute is <code>hidden</code>, <code>checkbox</code>, <code>radio</code>, <code>file</code>, or a button type (<code>button</code>, <code>submit</code>, <code>reset</code>, <code>image</code>).</p>
			<dl>
				<dt>Possible values are:</dt>
				<dd><code>on</code>: the browser can autocomplete the value using previously stored value<br>
				<code>off</code>: the user must explicity enter a value</dd>
			</dl>

#### **Type**: `null`

### .autofocus <div class="specs"><i>W3C</i></div> {#autofocus}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-autofocus">autofocus</a></code> attribute, which specifies that a form control should have input focus when the page loads, unless the user overrides it, for example by typing in a different control. Only one form element in a document can have the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-autofocus">autofocus</a></code> attribute. It cannot be applied if the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute is set to <code>hidden
</code> (that is, you cannot automatically set focus to a hidden control).

#### **Type**: `null`

### .checked <div class="specs"><i>W3C</i></div> {#checked}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the current state of the element when <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>checkbox</code> or <code>radio
</code>.

#### **Type**: `null`

### .defaultChecked <div class="specs"><i>W3C</i></div> {#defaultChecked}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets
</strong> the default state of a radio button or checkbox as originally specified in HTML that created this object.

#### **Type**: `null`

### .defaultValue <div class="specs"><i>W3C</i></div> {#defaultValue}

<em><code>string</code>:</em> <strong>Returns / Sets
</strong> the default value as originally specified in the HTML that created this object.

#### **Type**: `null`

### .dirName <div class="specs"><i>W3C</i></div> {#dirName}

<em><code>string</code>:</em> <strong>Returns / Sets 
</strong>the directionality of the element.

#### **Type**: `null`

### .disabled <div class="specs"><i>W3C</i></div> {#disabled}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-disabled">disabled</a></code> attribute, indicating that the control is not available for interaction. The input values will not be submitted with the form. See also <code><a href="/en-US/docs/Web/HTML/Element/input#attr-readonly">readonly</a>
</code>

#### **Type**: `null`

### .files <div class="specs"><i>W3C</i></div> {#files}

<em><a href="/en-US/docs/Web/API/FileList" title="An object of this type is returned by the files property of the HTML <input> element; this lets you access the list of files selected with the <input type=&quot;file&quot;> element. It's also used for a list of files dropped into web content when using the drag and drop API; see the DataTransfer object for details on this usage."><code>FileList</code></a><code> array</code>:</em> <strong>Returns
</strong> the list of selected files.

#### **Type**: `null`

### .form <div class="specs"><i>W3C</i></div> {#form}

<em><a href="/en-US/docs/Web/API/HTMLFormElement" title="The HTMLFormElement interface represents a <form> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements."><code>HTMLFormElement</code></a><code> object</code>:</em> <strong>Returns</strong> a reference to the parent <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code>
</a> element.

#### **Type**: `null`

### .formAction <div class="specs"><i>W3C</i></div> {#formAction}

<em><code>string</code>: </em><strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-formaction">formaction</a></code> attribute, containing the URI of a program that processes information submitted by the element. This overrides the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-action">action</a>
</code> attribute of the parent form.

#### **Type**: `null`

### .formEnctype <div class="specs"><i>W3C</i></div> {#formEnctype}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-formenctype">formenctype</a></code> attribute, containing the type of content that is used to submit the form to the server. This overrides the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-enctype">enctype</a>
</code> attribute of the parent form.

#### **Type**: `null`

### .formMethod <div class="specs"><i>W3C</i></div> {#formMethod}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-formmethod">formmethod</a></code> attribute, containing the HTTP method that the browser uses to submit the form. This overrides the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-method">method</a>
</code> attribute of the parent form.

#### **Type**: `null`

### .formNoValidate <div class="specs"><i>W3C</i></div> {#formNoValidate}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-formnovalidate">formnovalidate</a></code> attribute, indicating that the form is not to be validated when it is submitted. This overrides the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-novalidate">novalidate</a>
</code> attribute of the parent form.

#### **Type**: `null`

### .formTarget <div class="specs"><i>W3C</i></div> {#formTarget}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-formtarget">formtarget</a></code> attribute, containing a name or keyword indicating where to display the response that is received after submitting the form. This overrides the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-target">target</a>
</code> attribute of the parent form.

#### **Type**: `null`

### .height <div class="specs"><i>W3C</i></div> {#height}

<em><code>string</code>: </em><strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-height">height</a></code> attribute, which defines the height of the image displayed for the button, if the value of <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>image
</code>.

#### **Type**: `null`

### .indeterminate <div class="specs"><i>W3C</i></div> {#indeterminate}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns</strong> whether the checkbox or radio button is in indeterminate state. For checkboxes, the effect is that the appearance of the checkbox is obscured/greyed in some way as to indicate its state is indeterminate (not checked but not unchecked). Does not affect the value of the <code>checked
</code> attribute, and clicking the checkbox will set the value to false.

#### **Type**: `null`

### .inputMode <div class="specs"><i>W3C</i></div> {#inputMode}

Provides a hint to browsers as to the type of virtual keyboard configuration to use when editing this element or its contents.

#### **Type**: `null`

### .labels <div class="specs"><i>W3C</i></div> {#labels}

<em><a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a><code> array</code>:</em> <strong>Returns</strong> a list of <a href="/en-US/docs/Web/HTML/Element/label" title="The HTML <label> element represents a caption for an item in a user interface."><code>&lt;label&gt;</code>
</a> elements that are labels for this element.

#### **Type**: `null`

### .list <div class="specs"><i>W3C</i></div> {#list}

<em><a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a><code> object</code>:</em> <strong>Returns</strong> the element pointed by the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-list">list</a></code> attribute. The property may be <code>null
</code> if no HTML element found in the same tree.

#### **Type**: `null`

### .max <div class="specs"><i>W3C</i></div> {#max}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-max">max</a></code> attribute, containing the maximum (numeric or date-time) value for this item, which must not be less than its minimum (<code><a href="/en-US/docs/Web/HTML/Element/input#attr-min">min</a>
</code> attribute) value.

#### **Type**: `null`

### .maxLength <div class="specs"><i>W3C</i></div> {#maxLength}

<em><code>long</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-maxlength">maxlength</a></code> attribute, containing the <strong>maximum number of characters
</strong> (in Unicode code points) that the value can have. (If you set this to a negative number, an exception will be thrown.)

#### **Type**: `null`

### .min <div class="specs"><i>W3C</i></div> {#min}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-min">min</a></code> attribute, containing the minimum (numeric or date-time) value for this item, which must not be greater than its maximum (<code><a href="/en-US/docs/Web/HTML/Element/input#attr-max">max</a>
</code> attribute) value.

#### **Type**: `null`

### .minLength <div class="specs"><i>W3C</i></div> {#minLength}

<em><code>long</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-minlength">minlength</a></code> attribute, containing the <strong>minimum number of characters
</strong> (in Unicode code points) that the value can have. (If you set this to a negative number, an exception will be thrown.)

#### **Type**: `null`

### .multiple <div class="specs"><i>W3C</i></div> {#multiple}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-multiple">multiple</a>
</code> attribute, indicating whether more than one value is possible (e.g., multiple files).

#### **Type**: `null`

### .name <div class="specs"><i>W3C</i></div> {#name}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-name">name</a>
</code> attribute, containing a name that identifies the element when submitting the form.

#### **Type**: `null`

### .pattern <div class="specs"><i>W3C</i></div> {#pattern}

<p><em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-pattern">pattern</a></code> attribute, containing a <strong>regular expression</strong> that the control's value is checked against. Use the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-title">title</a></code> attribute to describe the pattern to help the user.
</p>
			<p>This attribute only applies when the value of the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute is <code>text</code>, <code>search</code>, <code>tel</code>, <code>url</code> or <code>email</code>.</p>

#### **Type**: `null`

### .placeholder <div class="specs"><i>W3C</i></div> {#placeholder}

<p><em><code>string</code>: </em><strong>Returns / Sets </strong>the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-placeholder">placeholder</a></code> attribute, containing a hint to the user of what can be entered in the control. The placeholder text must not contain carriage returns or line-feeds.
</p>
			<p>This attribute only applies when the value of the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute is <code>text</code>, <code>search</code>, <code>tel</code>, <code>url</code> or <code>email</code>.</p>

#### **Type**: `null`

### .readOnly <div class="specs"><i>W3C</i></div> {#readOnly}

<p><em><code>boolean</code>:</em><strong> Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-readonly">readonly</a></code> attribute, indicating that the user cannot modify the value of the control.
<br>
			<span class="inlineIndicator htmlVer htmlVerInline"><a href="/en-US/docs/HTML/HTML5">HTML5</a></span>.</p>
			<p>This attribute is ignored if the value of the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute is <code>hidden</code>, <code>range</code>, <code>color</code>, <code>checkbox</code>, <code>radio</code>, <code>file</code>, or a button type.</p>

#### **Type**: `null`

### .required <div class="specs"><i>W3C</i></div> {#required}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-required">required</a>
</code> attribute, indicating that the user must fill in a value before submitting a form.

#### **Type**: `null`

### .selectionDirection <div class="specs"><i>W3C</i></div> {#selectionDirection}

<p><em><code>string</code>:</em> <strong>Returns / Sets</strong> the direction in which selection occurred.
</p>
			<dl>
				<dt>Possible values are:</dt>
				<dd><code>forward</code> if selection was performed in the start-to-end direction of the current locale<br>
				<code>backward</code> for the opposite direction<br>
				<code>none</code> if the direction is unknown</dd>
			</dl>

#### **Type**: `null`

### .selectionEnd <div class="specs"><i>W3C</i></div> {#selectionEnd}

<em><code>unsigned long</code>:</em> <strong>Returns / Sets 
</strong>the end index of the selected text. When there's no selection, this returns the offset of the character immediately following the current text input cursor position.

#### **Type**: `null`

### .selectionStart <div class="specs"><i>W3C</i></div> {#selectionStart}

<em><code>unsigned long</code>:</em> <strong>Returns / Sets</strong> the beginning index of the selected text. When nothing is selected, this returns the position of the text input cursor (caret) inside of the <a href="/en-US/docs/Web/HTML/Element/input" title="The HTML <input> element is used to create interactive controls for web-based forms in order to accept data from the user; a wide variety of types of input data and control widgets are available, depending on the device and user agent. "><code>&lt;input&gt;</code>
</a> element.

#### **Type**: `null`

### .size <div class="specs"><i>W3C</i></div> {#size}

<p><em><code>unsigned long</code>:</em> <strong>Returns / Sets </strong>the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-size">size</a></code> attribute, which contains the <strong>visual size of the control</strong>. This value is in pixels unless the value of <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>text</code> or <code>password</code>, in which case, it is an integer number of characters.
</p>
			<p>This attribute only applies when <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is set to <code>text</code>, <code>search</code>, <code>tel</code>, <code>url</code>, <code>email</code>, or <code>password</code>.</p>

#### **Type**: `null`

### .src <div class="specs"><i>W3C</i></div> {#src}

<code><em>string</em></code><em>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-src">src</a></code> attribute, which specifies a URI for the location of an image to display on the graphical submit button, if the value of <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>image
</code>; otherwise it is ignored.

#### **Type**: `null`

### .step <div class="specs"><i>W3C</i></div> {#step}

<code><em>string</em></code><em>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-step">step</a></code> attribute, which works with<strong> </strong><code><a href="/en-US/docs/Web/HTML/Element/input#attr-min">min</a></code> and <code><a href="/en-US/docs/Web/HTML/Element/input#attr-max">max</a></code> to limit the increments at which a numeric or date-time value can be set. It can be the string <code>any</code> or a positive floating point number. If this is not set to <code>any
</code>, the control accepts only values at multiples of the step value greater than the minimum.

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

<code><em>string</em></code>: <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute, indicating the type of control to display. See <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute of <a href="/en-US/docs/Web/HTML/Element/input" title="The HTML <input> element is used to create interactive controls for web-based forms in order to accept data from the user; a wide variety of types of input data and control widgets are available, depending on the device and user agent. "><code>&lt;input&gt;</code>
</a> for possible values.

#### **Type**: `null`

### .validationMessage <div class="specs"><i>W3C</i></div> {#validationMessage}

<code><em>string</em></code><em>:</em> <strong>Returns</strong> a localized message that describes the validation constraints that the control does not satisfy (if any). This is the empty string if the control is not a candidate for constraint validation (<code><a href="/en-US/docs/Web/HTML/Element/input#attr-willvalidate">willvalidate</a></code> is <code>false</code>), or it satisfies its constraints. This value can be set by the <code>setCustomValidity
</code> method.

#### **Type**: `null`

### .validity <div class="specs"><i>W3C</i></div> {#validity}

<em><a href="/en-US/docs/Web/API/ValidityState" title="The ValidityState interface represents the validity states that an element can be in, with respect to constraint validation. Together, they help explain why an element's value fails to validate, if it's not valid."><code>ValidityState</code></a><code> object</code>:</em> <strong>Returns
</strong> the element's current validity state.

#### **Type**: `null`

### .value <div class="specs"><i>W3C</i></div> {#value}

<code><em>string</em></code><em>:</em> <strong>Returns / Sets
</strong> the current value of the control.
			<p class="note"><strong>Note:</strong> If the user enters a value different from the value expected, this may return an empty string.</p>

#### **Type**: `null`

### .valueAsDate <div class="specs"><i>W3C</i></div> {#valueAsDate}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date" title="Creates a JavaScript Date instance that represents a single moment in time in a platform-independent format."><code>Date</code></a><code> object</code>:</em> <strong>Returns / Sets</strong> the value of the element, interpreted as a date, or <code>null
</code> if conversion is not possible.

#### **Type**: `null`

### .valueAsNumber <div class="specs"><i>W3C</i></div> {#valueAsNumber}

<em><code>double</code>:</em> <strong>Returns
</strong> the value of the element, interpreted as one of the following, in order:
			<ul>
				<li>A time value</li>
				<li>A number</li>
				<li><code>NaN</code> if conversion is impossible</li>
			</ul>

#### **Type**: `null`

### .width <div class="specs"><i>W3C</i></div> {#width}

<code><em>string</em></code><em>:</em> <strong>Returns / Sets</strong> the document's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-width">width</a></code> attribute, which defines the width of the image displayed for the button, if the value of <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>image
</code>.

#### **Type**: `null`

### .willValidate <div class="specs"><i>W3C</i></div> {#willValidate}

<p><em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns</strong> whether the element is a candidate for constraint validation.
</p>
			<p>It is <code>false</code> if any conditions bar it from constraint validation, including: its <code>type</code> is <code>hidden</code>, <code>reset</code>, or <code>button</code>; it has a <a href="/en-US/docs/Web/HTML/Element/datalist">datalist</a> ancestor; or its <code>disabled</code> property is <code>true</code>.</p>

#### **Type**: `null`

## Methods

### .checkValidity*(...args)* <div class="specs"><i>W3C</i></div> {#checkValidity}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>false</code> if the element is a candidate for constraint validation, and it does not satisfy its constraints. In this case, it also fires an <code><a href="/en-US/docs/Web/Events/invalid" title="/en-US/docs/Web/Events/invalid">invalid</a></code> event at the element. It returns <code>true</code> if the element is not a candidate for constraint validation, or if it satisfies its constraints. Inherited from <a href="/en-US/docs/Web/API/HTMLObjectElement" title="The HTMLObjectElement interface provides special properties and methods (beyond those on the HTMLElement interface it also has available to it by inheritance) for manipulating the layout and presentation of <object> element, representing external resources."><code>HTMLObjectElement</code>
</a>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .reportValidity*(...args)* <div class="specs"><i>W3C</i></div> {#reportValidity}

Runs the <code>checkValidity()</code> method, and if it returns <code>false</code> (for an invalid input or no <code><a href="/en-US/docs/Web/HTML/Element/input#attr-pattern">pattern</a></code> pattern attribute provided), then it reports to the user that the input is invalid in the same manner as if you submitted a form. Inherited from <a href="/en-US/docs/Web/API/HTMLFormElement" title="The HTMLFormElement interface represents a <form> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements."><code>HTMLFormElement</code>
</a>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .select*(...args)* <div class="specs"><i>W3C</i></div> {#select}

Selects all the text in the <code>input
</code> element, and focuses it so the user can subsequently replace all of its content.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setCustomValidity*(...args)* <div class="specs"><i>W3C</i></div> {#setCustomValidity}

Sets a custom validity message for the element. If this message is not the empty string, then the element is suffering from a custom validity error, and does not validate. Inherited from <a href="/en-US/docs/Web/API/HTMLObjectElement" title="The HTMLObjectElement interface provides special properties and methods (beyond those on the HTMLElement interface it also has available to it by inheritance) for manipulating the layout and presentation of <object> element, representing external resources."><code>HTMLObjectElement</code>
</a>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setRangeText*(...args)* <div class="specs"><i>W3C</i></div> {#setRangeText}

Replaces a range of text in the <code>input
</code> element with new text.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setSelectionRange*(...args)* <div class="specs"><i>W3C</i></div> {#setSelectionRange}

Selects a range of text in the <code>input
</code> element (but does not focus it).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .stepDown*(...args)* <div class="specs"><i>W3C</i></div> {#stepDown}

Decrements the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-value">value</a></code> by (<code><a href="/en-US/docs/Web/HTML/Element/input#attr-step">step</a></code> * n), where <code><var>n</var></code> defaults to <code>1
</code> if not specified.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .stepUp*(...args)* <div class="specs"><i>W3C</i></div> {#stepUp}

Increments the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-value">value</a></code> by (<code><a href="/en-US/docs/Web/HTML/Element/input#attr-step">step</a></code> * n), where <code><var>n</var></code> defaults to <code>1
</code> if not specified.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
