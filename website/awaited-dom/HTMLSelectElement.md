# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLSelectElement

<div class='overview'>The <code><strong>HTMLSelectElement</strong></code> interface represents a <a href="/en-US/docs/Web/HTML/Element/select" title="The HTML <select> element represents a control that provides a menu of options"><code>&lt;select&gt;</code></a> HTML Element. These elements also share all of the properties and methods of other HTML elements via the <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface.</div>

## Properties

### .autocomplete <div class="specs"><i>W3C</i></div> {#autocomplete}

Needs content.

#### **Type**: `null`

### .autofocus <div class="specs"><i>W3C</i></div> {#autofocus}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/select#attr-autofocus">autofocus</a>
</code> HTML attribute, which indicates whether the control should have input focus when the page loads, unless the user overrides it, for example by typing in a different control. Only one form-associated element in a document can have this attribute specified. 

#### **Type**: `null`

### .disabled <div class="specs"><i>W3C</i></div> {#disabled}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/select#attr-disabled">disabled</a>
</code> HTML attribute, which indicates whether the control is disabled. If it is disabled, it does not accept clicks.

#### **Type**: `null`

### .form <div class="specs"><i>W3C</i></div> {#form}

An <a href="/en-US/docs/Web/API/HTMLFormElement" title="The HTMLFormElement interface represents a <form> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements."><code>HTMLFormElement</code></a> referencing the form that this element is associated with. If the element is not associated with of a <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code></a> element, then it returns <code>null
</code>.

#### **Type**: `null`

### .labels <div class="specs"><i>W3C</i></div> {#labels}

A <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> of <a href="/en-US/docs/Web/HTML/Element/label" title="The HTML <label> element represents a caption for an item in a user interface."><code>&lt;label&gt;</code>
</a> elements associated with the element.

#### **Type**: `null`

### .length <div class="specs"><i>W3C</i></div> {#length}

An <code>unsigned long </code>The number of <a href="/en-US/docs/Web/HTML/Element/option" title="The HTML <option> element is used to define an item contained in a <select>, an <optgroup>, or a <datalist>&nbsp;element. As such,&nbsp;<option>&nbsp;can represent menu items in popups and other lists of items in an HTML document."><code>&lt;option&gt;</code></a> elements in this <code>select
</code> element.

#### **Type**: `null`

### .multiple <div class="specs"><i>W3C</i></div> {#multiple}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/select#attr-multiple">multiple</a>
</code> HTML attribute, which indicates whether multiple items can be selected.

#### **Type**: `null`

### .name <div class="specs"><i>W3C</i></div> {#name}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/select#attr-name">name</a>
</code> HTML attribute, containing the name of this control used by servers and DOM search functions.

#### **Type**: `null`

### .options <div class="specs"><i>W3C</i></div> {#options}

An <a href="/en-US/docs/Web/API/HTMLOptionsCollection" title="This interface inherits the methods of its parent,&nbsp;HTMLCollection."><code>HTMLOptionsCollection</code></a> representing the set of <a href="/en-US/docs/Web/HTML/Element/option" title="The HTML <option> element is used to define an item contained in a <select>, an <optgroup>, or a <datalist>&nbsp;element. As such,&nbsp;<option>&nbsp;can represent menu items in popups and other lists of items in an HTML document."><code>&lt;option&gt;</code>
</a> elements contained by this element.

#### **Type**: `null`

### .required <div class="specs"><i>W3C</i></div> {#required}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/select#attr-required">required</a>
</code> HTML attribute, which indicates whether the user is required to select a value before submitting the form. 

#### **Type**: `null`

### .selectedIndex <div class="specs"><i>W3C</i></div> {#selectedIndex}

A <code>long</code> reflecting the index of the first selected <a href="/en-US/docs/Web/HTML/Element/option" title="The HTML <option> element is used to define an item contained in a <select>, an <optgroup>, or a <datalist>&nbsp;element. As such,&nbsp;<option>&nbsp;can represent menu items in popups and other lists of items in an HTML document."><code>&lt;option&gt;</code></a> element. The value <code>-1
</code> indicates no element is selected.

#### **Type**: `null`

### .selectedOptions <div class="specs"><i>W3C</i></div> {#selectedOptions}

An <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> representing the set of <a href="/en-US/docs/Web/HTML/Element/option" title="The HTML <option> element is used to define an item contained in a <select>, an <optgroup>, or a <datalist>&nbsp;element. As such,&nbsp;<option>&nbsp;can represent menu items in popups and other lists of items in an HTML document."><code>&lt;option&gt;</code>
</a> elements that are selected.

#### **Type**: `null`

### .size <div class="specs"><i>W3C</i></div> {#size}

A <code>long</code> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/select#attr-size">size</a></code> HTML attribute, which contains the number of visible items in the control. The default is 1, unless <code>multiple
</code> is true, in which case it is 4.

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> represeting the form control's type. When <code>multiple</code> is <code>true</code>, it returns <code>"select-multiple"</code>; otherwise, it returns <code>"select-one"
</code>.

#### **Type**: `null`

### .validationMessage <div class="specs"><i>W3C</i></div> {#validationMessage}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing a localized message that describes the validation constraints that the control does not satisfy (if any). This attribute is the empty string if the control is not a candidate for constraint validation (<code>willValidate
</code> is false), or it satisfies its constraints.

#### **Type**: `null`

### .validity <div class="specs"><i>W3C</i></div> {#validity}

A <a href="/en-US/docs/Web/API/ValidityState" title="The ValidityState interface represents the validity states that an element can be in, with respect to constraint validation. Together, they help explain why an element's value fails to validate, if it's not valid."><code>ValidityState</code>
</a> reflecting the validity state that this control is in.

#### **Type**: `null`

### .value <div class="specs"><i>W3C</i></div> {#value}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the value of the form control. Returns the <code>value
</code>&nbsp;property of the first selected option element if there is one, otherwise the empty string.

#### **Type**: `null`

### .willValidate <div class="specs"><i>W3C</i></div> {#willValidate}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> that indicates whether the button is a candidate for constraint validation. It is false if any conditions bar it from constraint validation.

#### **Type**: `null`

## Methods

### .add*(...args)* <div class="specs"><i>W3C</i></div> {#add}

Adds an element to the collection of <code>option</code> elements for this <code>select
</code> element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .checkValidity*(...args)* <div class="specs"><i>W3C</i></div> {#checkValidity}

Checks whether the element has any constraints and whether it satisfies them. If the element fails its constraints, the browser fires a cancelable <code><a href="/en-US/docs/Web/Events/invalid" title="/en-US/docs/Web/Events/invalid">invalid</a></code> event at the element (and returns <code>false
</code>).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .item*(...args)* <div class="specs"><i>W3C</i></div> {#item}

Gets an item from the options collection for this <a href="/en-US/docs/Web/HTML/Element/select" title="The HTML <select> element represents a control that provides a menu of options"><code>&lt;select&gt;</code>
</a> element. You can also access an item by specifying the index in array-style brackets or parentheses, without calling this method explicitly.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .namedItem*(...args)* <div class="specs"><i>W3C</i></div> {#namedItem}

Gets the item in the options collection with the specified name. The name string can match either the <code>id</code> or the <code>name
</code> attribute of an option node. You can also access an item by specifying the name in array-style brackets or parentheses, without calling this method explicitly.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .remove*(...args)* <div class="specs"><i>W3C</i></div> {#remove}

Removes the element at the specified index from the options collection for this select element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .reportValidity*(...args)* <div class="specs"><i>W3C</i></div> {#reportValidity}

This method reports the problems with the constraints on the element, if any, to the user. If there are problems, it fires a cancelable <a href="/en-US/docs/Web/Events/invalid">invalid</a> event at the element, and returns <code>false</code>; if there are no problems, it returns <code>true
</code>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setCustomValidity*(...args)* <div class="specs"><i>W3C</i></div> {#setCustomValidity}

Sets the custom validity message for the selection element to the specified message. Use the empty string to indicate that the element does <em>not
</em> have a custom validity error.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
