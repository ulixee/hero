# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLInputElement

<div class='overview'>The <strong><code>HTMLInputElement</code></strong> interface provides special properties and methods for manipulating the options, layout, and presentation of <a href="/en-US/docs/Web/HTML/Element/input" title="The HTML <input> element is used to create interactive controls for web-based forms in order to accept data from the user; a wide variety of types of input data and control widgets are available, depending on the device and user agent. "><code>&lt;input&gt;</code></a> elements.</div>

## Properties

### elem.accept <div class="specs"><i>W3C</i></div> {#accept}

<em><code>string</code>: </em><strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-accept">accept</a></code> attribute, containing comma-separated list of file types accepted by the server when <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>file
</code>.

#### **Type**: `string`

### elem.alt <div class="specs"><i>W3C</i></div> {#alt}

<em><code>string</code>: </em><strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-alt">alt</a></code> attribute, containing alternative text to use when <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>image.
</code>

#### **Type**: `string`

### elem.autocomplete <div class="specs"><i>W3C</i></div> {#autocomplete}

<p><em><code>string</code>: </em><strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-autocomplete">autocomplete</a></code> attribute, indicating whether the value of the control can be automatically completed by the browser.
</p>
			<p>Ignored if the value of the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute is <code>hidden</code>, <code>checkbox</code>, <code>radio</code>, <code>file</code>, or a button type (<code>button</code>, <code>submit</code>, <code>reset</code>, <code>image</code>).</p>
			<dl>
				<dt>Possible values are:</dt>
				<dd><code>on</code>: the browser can autocomplete the value using previously stored value<br>
				<code>off</code>: the user must explicity enter a value</dd>
			</dl>

#### **Type**: `string`

### elem.autofocus <div class="specs"><i>W3C</i></div> {#autofocus}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-autofocus">autofocus</a></code> attribute, which specifies that a form control should have input focus when the page loads, unless the user overrides it, for example by typing in a different control. Only one form element in a document can have the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-autofocus">autofocus</a></code> attribute. It cannot be applied if the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute is set to <code>hidden
</code> (that is, you cannot automatically set focus to a hidden control).

#### **Type**: `boolean`

### elem.checked <div class="specs"><i>W3C</i></div> {#checked}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the current state of the element when <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>checkbox</code> or <code>radio
</code>.

#### **Type**: `boolean`

### elem.defaultChecked <div class="specs"><i>W3C</i></div> {#defaultChecked}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets
</strong> the default state of a radio button or checkbox as originally specified in HTML that created this object.

#### **Type**: `boolean`

### elem.defaultValue <div class="specs"><i>W3C</i></div> {#defaultValue}

<em><code>string</code>:</em> <strong>Returns / Sets
</strong> the default value as originally specified in the HTML that created this object.

#### **Type**: `string`

### elem.dirName <div class="specs"><i>W3C</i></div> {#dirName}

<em><code>string</code>:</em> <strong>Returns / Sets 
</strong>the directionality of the element.

#### **Type**: `string`

### elem.disabled <div class="specs"><i>W3C</i></div> {#disabled}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-disabled">disabled</a></code> attribute, indicating that the control is not available for interaction. The input values will not be submitted with the form. See also <code><a href="/en-US/docs/Web/HTML/Element/input#attr-readonly">readonly</a>
</code>

#### **Type**: `boolean`

### elem.form <div class="specs"><i>W3C</i></div> {#form}

<em><a href="/en-US/docs/Web/API/HTMLFormElement" title="The HTMLFormElement interface represents a <form> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements."><code>HTMLFormElement</code></a><code> object</code>:</em> <strong>Returns</strong> a reference to the parent <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code>
</a> element.

#### **Type**: `HTMLFormElement`

### elem.formAction <div class="specs"><i>W3C</i></div> {#formAction}

<em><code>string</code>: </em><strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-formaction">formaction</a></code> attribute, containing the URI of a program that processes information submitted by the element. This overrides the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-action">action</a>
</code> attribute of the parent form.

#### **Type**: `string`

### elem.formEnctype <div class="specs"><i>W3C</i></div> {#formEnctype}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-formenctype">formenctype</a></code> attribute, containing the type of content that is used to submit the form to the server. This overrides the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-enctype">enctype</a>
</code> attribute of the parent form.

#### **Type**: `string`

### elem.formMethod <div class="specs"><i>W3C</i></div> {#formMethod}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-formmethod">formmethod</a></code> attribute, containing the HTTP method that the browser uses to submit the form. This overrides the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-method">method</a>
</code> attribute of the parent form.

#### **Type**: `string`

### elem.formNoValidate <div class="specs"><i>W3C</i></div> {#formNoValidate}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-formnovalidate">formnovalidate</a></code> attribute, indicating that the form is not to be validated when it is submitted. This overrides the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-novalidate">novalidate</a>
</code> attribute of the parent form.

#### **Type**: `boolean`

### elem.formTarget <div class="specs"><i>W3C</i></div> {#formTarget}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-formtarget">formtarget</a></code> attribute, containing a name or keyword indicating where to display the response that is received after submitting the form. This overrides the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-target">target</a>
</code> attribute of the parent form.

#### **Type**: `string`

### elem.height <div class="specs"><i>W3C</i></div> {#height}

<em><code>string</code>: </em><strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-height">height</a></code> attribute, which defines the height of the image displayed for the button, if the value of <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>image
</code>.

#### **Type**: `number`

### elem.indeterminate <div class="specs"><i>W3C</i></div> {#indeterminate}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns</strong> whether the checkbox or radio button is in indeterminate state. For checkboxes, the effect is that the appearance of the checkbox is obscured/greyed in some way as to indicate its state is indeterminate (not checked but not unchecked). Does not affect the value of the <code>checked
</code> attribute, and clicking the checkbox will set the value to false.

#### **Type**: `boolean`

### elem.inputMode <div class="specs"><i>W3C</i></div> {#inputMode}

Provides a hint to browsers as to the type of virtual keyboard configuration to use when editing this element or its contents.

#### **Type**: `string`

### elem.labels <div class="specs"><i>W3C</i></div> {#labels}

<em><a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a><code> array</code>:</em> <strong>Returns</strong> a list of <a href="/en-US/docs/Web/HTML/Element/label" title="The HTML <label> element represents a caption for an item in a user interface."><code>&lt;label&gt;</code>
</a> elements that are labels for this element.

#### **Type**: `SuperNodeList`

### elem.list <div class="specs"><i>W3C</i></div> {#list}

<em><a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a><code> object</code>:</em> <strong>Returns</strong> the element pointed by the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-list">list</a></code> attribute. The property may be <code>null
</code> if no HTML element found in the same tree.

#### **Type**: `SuperHTMLElement`

### elem.max <div class="specs"><i>W3C</i></div> {#max}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-max">max</a></code> attribute, containing the maximum (numeric or date-time) value for this item, which must not be less than its minimum (<code><a href="/en-US/docs/Web/HTML/Element/input#attr-min">min</a>
</code> attribute) value.

#### **Type**: `string`

### elem.maxLength <div class="specs"><i>W3C</i></div> {#maxLength}

<em><code>long</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-maxlength">maxlength</a></code> attribute, containing the <strong>maximum number of characters
</strong> (in Unicode code points) that the value can have. (If you set this to a negative number, an exception will be thrown.)

#### **Type**: `number`

### elem.min <div class="specs"><i>W3C</i></div> {#min}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-min">min</a></code> attribute, containing the minimum (numeric or date-time) value for this item, which must not be greater than its maximum (<code><a href="/en-US/docs/Web/HTML/Element/input#attr-max">max</a>
</code> attribute) value.

#### **Type**: `string`

### elem.minLength <div class="specs"><i>W3C</i></div> {#minLength}

<em><code>long</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-minlength">minlength</a></code> attribute, containing the <strong>minimum number of characters
</strong> (in Unicode code points) that the value can have. (If you set this to a negative number, an exception will be thrown.)

#### **Type**: `number`

### elem.multiple <div class="specs"><i>W3C</i></div> {#multiple}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-multiple">multiple</a>
</code> attribute, indicating whether more than one value is possible (e.g., multiple files).

#### **Type**: `boolean`

### elem.name <div class="specs"><i>W3C</i></div> {#name}

<em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-name">name</a>
</code> attribute, containing a name that identifies the element when submitting the form.

#### **Type**: `string`

### elem.pattern <div class="specs"><i>W3C</i></div> {#pattern}

<p><em><code>string</code>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-pattern">pattern</a></code> attribute, containing a <strong>regular expression</strong> that the control's value is checked against. Use the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-title">title</a></code> attribute to describe the pattern to help the user.
</p>
			<p>This attribute only applies when the value of the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute is <code>text</code>, <code>search</code>, <code>tel</code>, <code>url</code> or <code>email</code>.</p>

#### **Type**: `string`

### elem.placeholder <div class="specs"><i>W3C</i></div> {#placeholder}

<p><em><code>string</code>: </em><strong>Returns / Sets </strong>the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-placeholder">placeholder</a></code> attribute, containing a hint to the user of what can be entered in the control. The placeholder text must not contain carriage returns or line-feeds.
</p>
			<p>This attribute only applies when the value of the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute is <code>text</code>, <code>search</code>, <code>tel</code>, <code>url</code> or <code>email</code>.</p>

#### **Type**: `string`

### elem.readOnly <div class="specs"><i>W3C</i></div> {#readOnly}

<p><em><code>boolean</code>:</em><strong> Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-readonly">readonly</a></code> attribute, indicating that the user cannot modify the value of the control.
<br>
			<span class="inlineIndicator htmlVer htmlVerInline"><a href="/en-US/docs/HTML/HTML5">HTML5</a></span>.</p>
			<p>This attribute is ignored if the value of the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute is <code>hidden</code>, <code>range</code>, <code>color</code>, <code>checkbox</code>, <code>radio</code>, <code>file</code>, or a button type.</p>

#### **Type**: `boolean`

### elem.required <div class="specs"><i>W3C</i></div> {#required}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-required">required</a>
</code> attribute, indicating that the user must fill in a value before submitting a form.

#### **Type**: `boolean`

### elem.selectionDirection <div class="specs"><i>W3C</i></div> {#selectionDirection}

<p><em><code>string</code>:</em> <strong>Returns / Sets</strong> the direction in which selection occurred.
</p>
			<dl>
				<dt>Possible values are:</dt>
				<dd><code>forward</code> if selection was performed in the start-to-end direction of the current locale<br>
				<code>backward</code> for the opposite direction<br>
				<code>none</code> if the direction is unknown</dd>
			</dl>

#### **Type**: `string`

### elem.selectionEnd <div class="specs"><i>W3C</i></div> {#selectionEnd}

<em><code>unsigned long</code>:</em> <strong>Returns / Sets 
</strong>the end index of the selected text. When there's no selection, this returns the offset of the character immediately following the current text input cursor position.

#### **Type**: `number`

### elem.selectionStart <div class="specs"><i>W3C</i></div> {#selectionStart}

<em><code>unsigned long</code>:</em> <strong>Returns / Sets</strong> the beginning index of the selected text. When nothing is selected, this returns the position of the text input cursor (caret) inside of the <a href="/en-US/docs/Web/HTML/Element/input" title="The HTML <input> element is used to create interactive controls for web-based forms in order to accept data from the user; a wide variety of types of input data and control widgets are available, depending on the device and user agent. "><code>&lt;input&gt;</code>
</a> element.

#### **Type**: `number`

### elem.size <div class="specs"><i>W3C</i></div> {#size}

<p><em><code>unsigned long</code>:</em> <strong>Returns / Sets </strong>the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-size">size</a></code> attribute, which contains the <strong>visual size of the control</strong>. This value is in pixels unless the value of <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>text</code> or <code>password</code>, in which case, it is an integer number of characters.
</p>
			<p>This attribute only applies when <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is set to <code>text</code>, <code>search</code>, <code>tel</code>, <code>url</code>, <code>email</code>, or <code>password</code>.</p>

#### **Type**: `number`

### elem.src <div class="specs"><i>W3C</i></div> {#src}

<code><em>string</em></code><em>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-src">src</a></code> attribute, which specifies a URI for the location of an image to display on the graphical submit button, if the value of <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>image
</code>; otherwise it is ignored.

#### **Type**: `string`

### elem.step <div class="specs"><i>W3C</i></div> {#step}

<code><em>string</em></code><em>:</em> <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-step">step</a></code> attribute, which works with<strong> </strong><code><a href="/en-US/docs/Web/HTML/Element/input#attr-min">min</a></code> and <code><a href="/en-US/docs/Web/HTML/Element/input#attr-max">max</a></code> to limit the increments at which a numeric or date-time value can be set. It can be the string <code>any</code> or a positive floating point number. If this is not set to <code>any
</code>, the control accepts only values at multiples of the step value greater than the minimum.

#### **Type**: `string`

### elem.type <div class="specs"><i>W3C</i></div> {#type}

<code><em>string</em></code>: <strong>Returns / Sets</strong> the element's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute, indicating the type of control to display. See <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> attribute of <a href="/en-US/docs/Web/HTML/Element/input" title="The HTML <input> element is used to create interactive controls for web-based forms in order to accept data from the user; a wide variety of types of input data and control widgets are available, depending on the device and user agent. "><code>&lt;input&gt;</code>
</a> for possible values.

#### **Type**: `string`

### elem.validationMessage <div class="specs"><i>W3C</i></div> {#validationMessage}

<code><em>string</em></code><em>:</em> <strong>Returns</strong> a localized message that describes the validation constraints that the control does not satisfy (if any). This is the empty string if the control is not a candidate for constraint validation (<code><a href="/en-US/docs/Web/HTML/Element/input#attr-willvalidate">willvalidate</a></code> is <code>false</code>), or it satisfies its constraints. This value can be set by the <code>setCustomValidity
</code> method.

#### **Type**: `string`

### elem.validity <div class="specs"><i>W3C</i></div> {#validity}

<em><a href="/en-US/docs/Web/API/ValidityState" title="The ValidityState interface represents the validity states that an element can be in, with respect to constraint validation. Together, they help explain why an element's value fails to validate, if it's not valid."><code>ValidityState</code></a><code> object</code>:</em> <strong>Returns
</strong> the element's current validity state.

#### **Type**: `ValidityState`

### elem.value <div class="specs"><i>W3C</i></div> {#value}

<code><em>string</em></code><em>:</em> <strong>Returns / Sets
</strong> the current value of the control.
			<p class="note"><strong>Note:</strong> If the user enters a value different from the value expected, this may return an empty string.</p>

#### **Type**: `string`

### elem.valueAsDate <div class="specs"><i>W3C</i></div> {#valueAsDate}

<em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date" title="Creates a JavaScript Date instance that represents a single moment in time in a platform-independent format."><code>Date</code></a><code> object</code>:</em> <strong>Returns / Sets</strong> the value of the element, interpreted as a date, or <code>null
</code> if conversion is not possible.

#### **Type**: `any`

### elem.valueAsNumber <div class="specs"><i>W3C</i></div> {#valueAsNumber}

<em><code>double</code>:</em> <strong>Returns
</strong> the value of the element, interpreted as one of the following, in order:
			<ul>
				<li>A time value</li>
				<li>A number</li>
				<li><code>NaN</code> if conversion is impossible</li>
			</ul>

#### **Type**: `number`

### elem.width <div class="specs"><i>W3C</i></div> {#width}

<code><em>string</em></code><em>:</em> <strong>Returns / Sets</strong> the document's <code><a href="/en-US/docs/Web/HTML/Element/input#attr-width">width</a></code> attribute, which defines the width of the image displayed for the button, if the value of <code><a href="/en-US/docs/Web/HTML/Element/input#attr-type">type</a></code> is <code>image
</code>.

#### **Type**: `number`

### elem.willValidate <div class="specs"><i>W3C</i></div> {#willValidate}

<p><em><a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>:</em> <strong>Returns</strong> whether the element is a candidate for constraint validation.
</p>
			<p>It is <code>false</code> if any conditions bar it from constraint validation, including: its <code>type</code> is <code>hidden</code>, <code>reset</code>, or <code>button</code>; it has a <a href="/en-US/docs/Web/HTML/Element/datalist">datalist</a> ancestor; or its <code>disabled</code> property is <code>true</code>.</p>

#### **Type**: `boolean`

### elem.accessKey <div class="specs"><i>W3C</i></div> {#accessKey}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the access key assigned to the element.

#### **Type**: `string`

### elem.autoCapitalize <div class="specs"><i>W3C</i></div> {#autoCapitalize}

Needs content.

#### **Type**: `string`

### elem.dir <div class="specs"><i>W3C</i></div> {#dir}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a>, reflecting the <code>dir</code> global attribute, representing the directionality of the element. Possible values are <code>"ltr"</code>, <code>"rtl"</code>, and <code>"auto"
</code>.

#### **Type**: `string`

### elem.draggable <div class="specs"><i>W3C</i></div> {#draggable}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element can be dragged.

#### **Type**: `boolean`

### elem.hidden <div class="specs"><i>W3C</i></div> {#hidden}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element is hidden or not.

#### **Type**: `boolean`

### elem.inert <div class="specs"><i>W3C</i></div> {#inert}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating whether the user agent must act as though the given node is absent for the purposes of user interaction events, in-page text searches ("find in page"), and text selection.

#### **Type**: `boolean`

### elem.innerText <div class="specs"><i>W3C</i></div> {#innerText}

Represents the "rendered" text content of a node and its descendants. As a getter, it approximates the text the user would get if they highlighted the contents of the element with the cursor and then copied it to the clipboard.

#### **Type**: `string`

### elem.lang <div class="specs"><i>W3C</i></div> {#lang}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the language of an element's attributes, text, and element contents.

#### **Type**: `string`

### elem.offsetHeight <div class="specs"><i>W3C</i></div> {#offsetHeight}

Returns a <code>double
</code> containing the height of an element, relative to the layout.

#### **Type**: `number`

### elem.offsetLeft <div class="specs"><i>W3C</i></div> {#offsetLeft}

Returns a <code>double</code>, the distance from this element's left border to its <code>offsetParent
</code>'s left border.

#### **Type**: `number`

### elem.offsetParent <div class="specs"><i>W3C</i></div> {#offsetParent}

Returns a <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> that is the element from which all offset calculations are currently computed.

#### **Type**: `SuperElement`

### elem.offsetTop <div class="specs"><i>W3C</i></div> {#offsetTop}

Returns a <code>double</code>, the distance from this element's top border to its <code>offsetParent
</code>'s top border.

#### **Type**: `number`

### elem.offsetWidth <div class="specs"><i>W3C</i></div> {#offsetWidth}

Returns a <code>double
</code> containing the width of an element, relative to the layout.

#### **Type**: `number`

### elem.spellcheck <div class="specs"><i>W3C</i></div> {#spellcheck}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that controls <a href="/en-US/docs/HTML/Controlling_spell_checking_in_HTML_forms" title="en/Controlling_spell_checking_in_HTML_forms">spell-checking
</a>. It is present on all HTML elements, though it doesn't have an effect on all of them.

#### **Type**: `boolean`

### elem.title <div class="specs"><i>W3C</i></div> {#title}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> containing the text that appears in a popup box when mouse is over the element.

#### **Type**: `string`

### elem.translate <div class="specs"><i>W3C</i></div> {#translate}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> representing the translation.

#### **Type**: `boolean`

### elem.attributes <div class="specs"><i>W3C</i></div> {#attributes}

Returns a <a href="/en-US/docs/Web/API/NamedNodeMap" title="The NamedNodeMap interface represents a collection of Attr objects. Objects inside a NamedNodeMap are not in any particular order, unlike NodeList, although they may be accessed by an index as in an array."><code>NamedNodeMap</code>
</a> object containing the assigned attributes of the corresponding HTML element.

#### **Type**: `NamedNodeMap`

### elem.classList <div class="specs"><i>W3C</i></div> {#classList}

Returns a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code>
</a> containing the list of class attributes.

#### **Type**: `DOMTokenList`

### elem.className <div class="specs"><i>W3C</i></div> {#className}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the class of the element.

#### **Type**: `string`

### elem.clientHeight <div class="specs"><i>W3C</i></div> {#clientHeight}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the inner height of the element.

#### **Type**: `number`

### elem.clientLeft <div class="specs"><i>W3C</i></div> {#clientLeft}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the width of the left border of the element.

#### **Type**: `number`

### elem.clientTop <div class="specs"><i>W3C</i></div> {#clientTop}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the width of the top border of the element.

#### **Type**: `number`

### elem.clientWidth <div class="specs"><i>W3C</i></div> {#clientWidth}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the inner width of the element.

#### **Type**: `number`

### elem.id <div class="specs"><i>W3C</i></div> {#id}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the id of the element.

#### **Type**: `string`

### elem.innerHTML <div class="specs"><i>W3C</i></div> {#innerHTML}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the markup of the element's content.

#### **Type**: `string`

### elem.localName <div class="specs"><i>W3C</i></div> {#localName}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the local part of the qualified name of the element.

#### **Type**: `string`

### elem.namespaceURI <div class="specs"><i>W3C</i></div> {#namespaceURI}

The namespace URI of the element, or <code>null
</code> if it is no namespace.
 <div class="note">
 <p><strong>Note:</strong> In Firefox 3.5 and earlier, HTML elements are in no namespace. In later versions, HTML elements are in the <code><a class="external linkification-ext" href="http://www.w3.org/1999/xhtml" rel="noopener" title="Linkification: http://www.w3.org/1999/xhtml">http://www.w3.org/1999/xhtml</a></code> namespace in both HTML and XML trees. </p>
 </div>
 

#### **Type**: `string`

### elem.outerHTML <div class="specs"><i>W3C</i></div> {#outerHTML}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the markup of the element including its content. When used as a setter, replaces the element with nodes parsed from the given string.

#### **Type**: `string`

### elem.part <div class="specs"><i>W3C</i></div> {#part}

Represents the part identifier(s) of the element (i.e. set using the <code>part</code> attribute), returned as a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code>
</a>.

#### **Type**: `DOMTokenList`

### elem.prefix <div class="specs"><i>W3C</i></div> {#prefix}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the namespace prefix of the element, or <code>null
</code> if no prefix is specified.

#### **Type**: `string`

### elem.scrollHeight <div class="specs"><i>W3C</i></div> {#scrollHeight}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the scroll view height of an element.

#### **Type**: `number`

### elem.scrollLeft <div class="specs"><i>W3C</i></div> {#scrollLeft}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the left scroll offset of the element.

#### **Type**: `number`

### elem.scrollTop <div class="specs"><i>W3C</i></div> {#scrollTop}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing number of pixels the top of the document is scrolled vertically.

#### **Type**: `number`

### elem.scrollWidth <div class="specs"><i>W3C</i></div> {#scrollWidth}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number" title="The Number JavaScript object is a wrapper object allowing you to work with numerical values. A Number object is created using the Number() constructor. A&nbsp;primitive type object number is&nbsp;created using the Number() function."><code>Number</code>
</a> representing the scroll view width of the element.

#### **Type**: `number`

### elem.shadowRoot <div class="specs"><i>W3C</i></div> {#shadowRoot}

Returns the open shadow root that is hosted by the element, or null if no open shadow root is present.

#### **Type**: `ShadowRoot`

### elem.slot <div class="specs"><i>W3C</i></div> {#slot}

Returns the name of the shadow DOM slot the element is inserted in.

#### **Type**: `string`

### elem.tagName <div class="specs"><i>W3C</i></div> {#tagName}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/String" title="The String global object is a constructor for strings or a sequence of characters."><code>String</code>
</a> with the name of the tag for the given element.

#### **Type**: `string`

### elem.baseURI <div class="specs"><i>W3C</i></div> {#baseURI}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the base URL of the document containing the <code>Node
</code>.

#### **Type**: `string`

### elem.childNodes <div class="specs"><i>W3C</i></div> {#childNodes}

Returns a live <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> containing all the children of this node. <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> being live means that if the children of the <code>Node</code> change, the <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code>
</a> object is automatically updated.

#### **Type**: `SuperNodeList`

### elem.firstChild <div class="specs"><i>W3C</i></div> {#firstChild}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the first direct child node of the node, or <code>null
</code> if the node has no child.

#### **Type**: `SuperNode`

### elem.isConnected <div class="specs"><i>W3C</i></div> {#isConnected}

A boolean indicating whether or not the Node is connected (directly or indirectly) to the context object, e.g. the <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> object in the case of the normal DOM, or the <a href="/en-US/docs/Web/API/ShadowRoot" title="The ShadowRoot interface of the Shadow DOM API is the root node of a DOM subtree that is rendered separately from a document's main DOM tree."><code>ShadowRoot</code>
</a> in the case of a shadow DOM.

#### **Type**: `boolean`

### elem.lastChild <div class="specs"><i>W3C</i></div> {#lastChild}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the last direct child node of the node, or <code>null
</code> if the node has no child.

#### **Type**: `SuperNode`

### elem.nextSibling <div class="specs"><i>W3C</i></div> {#nextSibling}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the next node in the tree, or <code>null
</code> if there isn't such node.

#### **Type**: `SuperNode`

### elem.nodeName <div class="specs"><i>W3C</i></div> {#nodeName}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the name of the <code>Node</code>. The structure of the name will differ with the node type. E.g. An <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> will contain the name of the corresponding tag, like <code>'audio'</code> for an <a href="/en-US/docs/Web/API/HTMLAudioElement" title="The HTMLAudioElement interface provides access to the properties of <audio> elements, as well as methods to manipulate them."><code>HTMLAudioElement</code></a>, a <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a> node will have the <code>'#text'</code> string, or a <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> node will have the <code>'#document'
</code> string.

#### **Type**: `string`

### elem.nodeType <div class="specs"><i>W3C</i></div> {#nodeType}

Returns an <code>unsigned short
</code> representing the type of the node. Possible values are:
	<table class="standard-table">
		<thead>
			<tr>
				<th scope="col">Name</th>
				<th scope="col">Value</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><code>ELEMENT_NODE</code></td>
				<td><code>1</code></td>
			</tr>
			<tr>
				<td><code>ATTRIBUTE_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>2</code></td>
			</tr>
			<tr>
				<td><code>TEXT_NODE</code></td>
				<td><code>3</code></td>
			</tr>
			<tr>
				<td><code>CDATA_SECTION_NODE</code></td>
				<td><code>4</code></td>
			</tr>
			<tr>
				<td><code>ENTITY_REFERENCE_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>5</code></td>
			</tr>
			<tr>
				<td><code>ENTITY_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>6</code></td>
			</tr>
			<tr>
				<td><code>PROCESSING_INSTRUCTION_NODE</code></td>
				<td><code>7</code></td>
			</tr>
			<tr>
				<td><code>COMMENT_NODE</code></td>
				<td><code>8</code></td>
			</tr>
			<tr>
				<td><code>DOCUMENT_NODE</code></td>
				<td><code>9</code></td>
			</tr>
			<tr>
				<td><code>DOCUMENT_TYPE_NODE</code></td>
				<td><code>10</code></td>
			</tr>
			<tr>
				<td><code>DOCUMENT_FRAGMENT_NODE</code></td>
				<td><code>11</code></td>
			</tr>
			<tr>
				<td><code>NOTATION_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>12</code></td>
			</tr>
		</tbody>
	</table>
	

#### **Type**: `number`

### elem.nodeValue <div class="specs"><i>W3C</i></div> {#nodeValue}

Returns / Sets the value of the current node.

#### **Type**: `string`

### elem.ownerDocument <div class="specs"><i>W3C</i></div> {#ownerDocument}

Returns the <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> that this node belongs to. If the node is itself a document, returns <code>null
</code>.

#### **Type**: `SuperDocument`

### elem.parentElement <div class="specs"><i>W3C</i></div> {#parentElement}

Returns an <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that is the parent of this node. If the node has no parent, or if that parent is not an <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>, this property returns <code>null
</code>.

#### **Type**: `SuperElement`

### elem.parentNode <div class="specs"><i>W3C</i></div> {#parentNode}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> that is the parent of this node. If there is no such node, like if this node is the top of the tree or if doesn't participate in a tree, this property returns <code>null
</code>.

#### **Type**: `SuperNode`

### elem.previousSibling <div class="specs"><i>W3C</i></div> {#previousSibling}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the previous node in the tree, or <code>null
</code> if there isn't such node.

#### **Type**: `SuperNode`

### elem.textContent <div class="specs"><i>W3C</i></div> {#textContent}

Returns / Sets the textual content of an element and all its descendants.

#### **Type**: `string`

### elem.nextElementSibling <div class="specs"><i>W3C</i></div> {#nextElementSibling}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> immediately following this node in its parent's children list, or <code>null</code> if there is no <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> in the list following this node.

#### **Type**: `SuperElement`

### elem.previousElementSibling <div class="specs"><i>W3C</i></div> {#previousElementSibling}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> immediately prior to this node in its parent's children list, or <code>null</code> if there is no <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> in the list prior to this node.

#### **Type**: `SuperElement`

### elem.childElementCount <div class="specs"><i>W3C</i></div> {#childElementCount}

Returns the number of children of this <code>ParentNode
</code> which are elements.

#### **Type**: `number`

### elem.children <div class="specs"><i>W3C</i></div> {#children}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> containing all of the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> objects that are children of this <code>ParentNode
</code>, omitting all of its non-element nodes.

#### **Type**: `SuperHTMLCollection`

### elem.firstElementChild <div class="specs"><i>W3C</i></div> {#firstElementChild}

Returns the first node which is both a child of this <code>ParentNode</code> <em>and</em> is also an <code>Element</code>, or <code>null
</code> if there is none.

#### **Type**: `SuperElement`

### elem.lastElementChild <div class="specs"><i>W3C</i></div> {#lastElementChild}

Returns the last node which is both a child of this <code>ParentNode</code> <em>and</em> is an <code>Element</code>, or <code>null
</code> if there is none.

#### **Type**: `SuperElement`

## Methods

### elem.checkValidity*(...args)* <div class="specs"><i>W3C</i></div> {#checkValidity}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that is <code>false</code> if the element is a candidate for constraint validation, and it does not satisfy its constraints. In this case, it also fires an <code><a href="/en-US/docs/Web/Events/invalid" title="/en-US/docs/Web/Events/invalid">invalid</a></code> event at the element. It returns <code>true</code> if the element is not a candidate for constraint validation, or if it satisfies its constraints. Inherited from <a href="/en-US/docs/Web/API/HTMLObjectElement" title="The HTMLObjectElement interface provides special properties and methods (beyond those on the HTMLElement interface it also has available to it by inheritance) for manipulating the layout and presentation of <object> element, representing external resources."><code>HTMLObjectElement</code>
</a>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.reportValidity*(...args)* <div class="specs"><i>W3C</i></div> {#reportValidity}

Runs the <code>checkValidity()</code> method, and if it returns <code>false</code> (for an invalid input or no <code><a href="/en-US/docs/Web/HTML/Element/input#attr-pattern">pattern</a></code> pattern attribute provided), then it reports to the user that the input is invalid in the same manner as if you submitted a form. Inherited from <a href="/en-US/docs/Web/API/HTMLFormElement" title="The HTMLFormElement interface represents a <form> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements."><code>HTMLFormElement</code>
</a>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.select*(...args)* <div class="specs"><i>W3C</i></div> {#select}

Selects all the text in the <code>input
</code> element, and focuses it so the user can subsequently replace all of its content.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.setRangeText*(...args)* <div class="specs"><i>W3C</i></div> {#setRangeText}

Replaces a range of text in the <code>input
</code> element with new text.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.setSelectionRange*(...args)* <div class="specs"><i>W3C</i></div> {#setSelectionRange}

Selects a range of text in the <code>input
</code> element (but does not focus it).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.stepDown*(...args)* <div class="specs"><i>W3C</i></div> {#stepDown}

Decrements the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-value">value</a></code> by (<code><a href="/en-US/docs/Web/HTML/Element/input#attr-step">step</a></code> * n), where <code><var>n</var></code> defaults to <code>1
</code> if not specified.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.stepUp*(...args)* <div class="specs"><i>W3C</i></div> {#stepUp}

Increments the <code><a href="/en-US/docs/Web/HTML/Element/input#attr-value">value</a></code> by (<code><a href="/en-US/docs/Web/HTML/Element/input#attr-step">step</a></code> * n), where <code><var>n</var></code> defaults to <code>1
</code> if not specified.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.click*(...args)* <div class="specs"><i>W3C</i></div> {#click}

Sends a mouse click event to the element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.closest*(...args)* <div class="specs"><i>W3C</i></div> {#closest}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> which is the closest ancestor of the current element (or the current element itself) which matches the selectors given in parameter.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getAttribute*(...args)* <div class="specs"><i>W3C</i></div> {#getAttribute}

Retrieves the value of the named attribute from the current node and returns it as an <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object" title="The Object class represents one of JavaScript's data types. It is used to store&nbsp;various keyed collections and more complex entities. Objects can be created using the Object() constructor or the object initializer / literal syntax."><code>Object</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getAttributeNames*(...args)* <div class="specs"><i>W3C</i></div> {#getAttributeNames}

Returns an array of attribute names from the current element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getAttributeNode*(...args)* <div class="specs"><i>W3C</i></div> {#getAttributeNode}

Retrieves the node representation of the named attribute from the current node and returns it as an <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getAttributeNodeNS*(...args)* <div class="specs"><i>W3C</i></div> {#getAttributeNodeNS}

Retrieves the node representation of the attribute with the specified name and namespace, from the current node and returns it as an <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getAttributeNS*(...args)* <div class="specs"><i>W3C</i></div> {#getAttributeNS}

Retrieves the value of the attribute with the specified name and namespace, from the current node and returns it as an <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object" title="The Object class represents one of JavaScript's data types. It is used to store&nbsp;various keyed collections and more complex entities. Objects can be created using the Object() constructor or the object initializer / literal syntax."><code>Object</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getBoundingClientRect*(...args)* <div class="specs"><i>W3C</i></div> {#getBoundingClientRect}

Returns the size of an element and its position relative to the viewport.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getClientRects*(...args)* <div class="specs"><i>W3C</i></div> {#getClientRects}

Returns a collection of rectangles that indicate the bounding rectangles for each line of text in a client.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getElementsByClassName*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByClassName}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code>
</a> that contains all descendants of the current element that possess the list of classes given in the parameter.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getElementsByTagName*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByTagName}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code>
</a> containing all descendant elements, of a particular tag name, from the current element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getElementsByTagNameNS*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByTagNameNS}

Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code>
</a> containing all descendant elements, of a particular tag name and namespace, from the current element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.hasAttribute*(...args)* <div class="specs"><i>W3C</i></div> {#hasAttribute}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element has the specified attribute or not.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.hasAttributeNS*(...args)* <div class="specs"><i>W3C</i></div> {#hasAttributeNS}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element has the specified attribute, in the specified namespace, or not.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.hasAttributes*(...args)* <div class="specs"><i>W3C</i></div> {#hasAttributes}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element has one or more HTML attributes present.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.hasPointerCapture*(...args)* <div class="specs"><i>W3C</i></div> {#hasPointerCapture}

Indicates whether the element on which it is invoked has pointer capture for the pointer identified by the given pointer ID.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.matches*(...args)* <div class="specs"><i>W3C</i></div> {#matches}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating whether or not the element would be selected by the specified selector string.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.requestFullscreen*(...args)* <div class="specs"><i>W3C</i></div> {#requestFullscreen}

Asynchronously asks the browser to make the element full-screen.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.requestPointerLock*(...args)* <div class="specs"><i>W3C</i></div> {#requestPointerLock}

Allows to asynchronously ask for the pointer to be locked on the given element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.scrollIntoView*(...args)* <div class="specs"><i>W3C</i></div> {#scrollIntoView}

Scrolls the page until the element gets into the view.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.compareDocumentPosition*(...args)* <div class="specs"><i>W3C</i></div> {#compareDocumentPosition}

Compares the position of the current node against another node in any other document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.contains*(...args)* <div class="specs"><i>W3C</i></div> {#contains}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> value indicating whether or not a node is a descendant of the calling node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.getRootNode*(...args)* <div class="specs"><i>W3C</i></div> {#getRootNode}

Returns the context object's root which optionally includes the shadow root if it is available.&nbsp;

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.hasChildNodes*(...args)* <div class="specs"><i>W3C</i></div> {#hasChildNodes}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating whether or not the element has any child nodes.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.isDefaultNamespace*(...args)* <div class="specs"><i>W3C</i></div> {#isDefaultNamespace}

Accepts a namespace URI as an argument and returns a&nbsp;<a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a>&nbsp;with a value of&nbsp;<code>true</code>&nbsp;if the namespace is the default namespace on the given node or&nbsp;<code>false
</code>&nbsp;if not.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.isEqualNode*(...args)* <div class="specs"><i>W3C</i></div> {#isEqualNode}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> which indicates whether or not two nodes are of the same type and all their defining data points match.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.isSameNode*(...args)* <div class="specs"><i>W3C</i></div> {#isSameNode}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> value indicating whether or not the two nodes are the same (that is, they reference the same object).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.lookupNamespaceURI*(...args)* <div class="specs"><i>W3C</i></div> {#lookupNamespaceURI}

Accepts a prefix and returns the namespace URI associated with it on the given node if found (and&nbsp;<code>null</code>&nbsp;if not). Supplying&nbsp;<code>null
</code>&nbsp;for the prefix will return the default namespace.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.lookupPrefix*(...args)* <div class="specs"><i>W3C</i></div> {#lookupPrefix}

Returns a&nbsp;<a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the prefix for a given namespace URI, if present, and&nbsp;<code>null
</code>&nbsp;if not. When multiple prefixes are possible, the result is implementation-dependent.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.normalize*(...args)* <div class="specs"><i>W3C</i></div> {#normalize}

Clean up all the text nodes under this element (merge adjacent, remove empty).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.blur*(...args)* <div class="specs"><i>W3C</i></div> {#blur}

Needs content.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.focus*(...args)* <div class="specs"><i>W3C</i></div> {#focus}

Needs content.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.querySelector*(...args)* <div class="specs"><i>W3C</i></div> {#querySelector}

Returns the first <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### elem.querySelectorAll*(...args)* <div class="specs"><i>W3C</i></div> {#querySelectorAll}

Returns a <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code>
</a> representing a list of elements with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

## Unimplemented Specs


This class has 92 unimplemented properties and 35 unimplemented methods.
