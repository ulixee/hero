# HTMLOptionElement

<div class='overview'>The <strong><code>HTMLOptionElement</code></strong> interface represents <a href="/en-US/docs/Web/HTML/Element/option" title="The HTML <option> element is used to define an item contained in a <select>, an <optgroup>, or a <datalist>&nbsp;element. As such,&nbsp;<option>&nbsp;can represent menu items in popups and other lists of items in an HTML document."><code>&lt;option&gt;</code></a> elements and inherits all classes and methods of the <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface.</div>

## Properties

### .defaultSelected <div class="specs"><i>W3C</i></div> {#defaultSelected}

Contains the initial value of the <code><a href="/en-US/docs/Web/HTML/Element/option#attr-selected">selected</a></code> HTML attribute, indicating whether the option is selected by default or not.

#### **Type**: `SuperDocument`

### .disabled <div class="specs"><i>W3C</i></div> {#disabled}

Reflects the value of the <code><a href="/en-US/docs/Web/HTML/Element/option#attr-disabled">disabled</a></code> HTML&nbsp;attribute, which indicates that the option is unavailable to be selected. An option can also be disabled if it is a child of an <a href="/en-US/docs/Web/HTML/Element/optgroup" title="The HTML <optgroup> element creates a grouping of options within a <select> element."><code>&lt;optgroup&gt;</code></a> element that is disabled.

#### **Type**: `SuperDocument`

### .form <div class="specs"><i>W3C</i></div> {#form}

If the option is a descendent of a <a href="/en-US/docs/Web/HTML/Element/select" title="The HTML <select> element represents a control that provides a menu of options"><code>&lt;select&gt;</code></a> element, then this property has the same value as the <code>form</code> property of the corresponding <a href="/en-US/docs/Web/API/HTMLSelectElement" title="The HTMLSelectElement interface represents a <select> HTML Element. These elements also share all of the properties and methods of other HTML elements via the HTMLElement interface."><code>HTMLSelectElement</code></a> object; otherwise, it is <code>null</code>.

#### **Type**: `SuperDocument`

### .index <div class="specs"><i>W3C</i></div> {#index}

The position of the option within the list of options it belongs to, in tree-order. If the option is not part of a list of options, like when it is part of the <a href="/en-US/docs/Web/HTML/Element/datalist" title="The HTML <datalist> element contains a set of <option> elements that represent the permissible or recommended options available to choose from within other controls."><code>&lt;datalist&gt;</code></a> element, the value is <code>0</code>.

#### **Type**: `SuperDocument`

### .label <div class="specs"><i>W3C</i></div> {#label}

Reflects the value of the <code><a href="/en-US/docs/Web/HTML/Element/option#attr-label">label</a></code> HTML attribute, which provides a label for the option. If this attribute isn't specifically set, reading it returns the element's text content.

#### **Type**: `SuperDocument`

### .selected <div class="specs"><i>W3C</i></div> {#selected}

Indicates whether the option is currently selected.

#### **Type**: `SuperDocument`

### .text <div class="specs"><i>W3C</i></div> {#text}

Contains the text content of the element.

#### **Type**: `SuperDocument`

### .value <div class="specs"><i>W3C</i></div> {#value}

Reflects the value of the <code><a href="/en-US/docs/Web/HTML/Element/option#attr-value">value</a></code> HTML attribute, if it exists; otherwise reflects value of the <a href="/en-US/docs/Web/API/Node/textContent" title="The textContent property of the Node interface represents the text content of the node and its descendants."><code>Node.textContent</code></a> property.

#### **Type**: `SuperDocument`

## Methods

## Events
