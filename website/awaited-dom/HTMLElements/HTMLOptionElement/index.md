# HTMLOptionElement

<div class='overview'>The <strong><code>HTMLOptionElement</code></strong> interface represents <a href="/en-US/docs/Web/HTML/Element/option" title="The HTML <option> element is used to define an item contained in a <select>, an <optgroup>, or a <datalist>&nbsp;element. As such,&nbsp;<option>&nbsp;can represent menu items in popups and other lists of items in an HTML document."><code>&lt;option&gt;</code></a> elements and inherits all classes and methods of the <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">defaultSelected</a>
    <div>Contains the initial value of the <code><a href="/en-US/docs/Web/HTML/Element/option#attr-selected">selected</a></code> HTML attribute, indicating whether the option is selected by default or not.</div>
  </li>
  <li>
    <a href="">disabled</a>
    <div>Reflects the value of the <code><a href="/en-US/docs/Web/HTML/Element/option#attr-disabled">disabled</a></code> HTML&nbsp;attribute, which indicates that the option is unavailable to be selected. An option can also be disabled if it is a child of an <a href="/en-US/docs/Web/HTML/Element/optgroup" title="The HTML <optgroup> element creates a grouping of options within a <select> element."><code>&lt;optgroup&gt;</code></a> element that is disabled.</div>
  </li>
  <li>
    <a href="">form</a>
    <div>If the option is a descendent of a <a href="/en-US/docs/Web/HTML/Element/select" title="The HTML <select> element represents a control that provides a menu of options"><code>&lt;select&gt;</code></a> element, then this property has the same value as the <code>form</code> property of the corresponding <a href="/en-US/docs/Web/API/HTMLSelectElement" title="The HTMLSelectElement interface represents a <select> HTML Element. These elements also share all of the properties and methods of other HTML elements via the HTMLElement interface."><code>HTMLSelectElement</code></a> object; otherwise, it is <code>null</code>.</div>
  </li>
  <li>
    <a href="">index</a>
    <div>The position of the option within the list of options it belongs to, in tree-order. If the option is not part of a list of options, like when it is part of the <a href="/en-US/docs/Web/HTML/Element/datalist" title="The HTML <datalist> element contains a set of <option> elements that represent the permissible or recommended options available to choose from within other controls."><code>&lt;datalist&gt;</code></a> element, the value is <code>0</code>.</div>
  </li>
  <li>
    <a href="">label</a>
    <div>Reflects the value of the <code><a href="/en-US/docs/Web/HTML/Element/option#attr-label">label</a></code> HTML attribute, which provides a label for the option. If this attribute isn't specifically set, reading it returns the element's text content.</div>
  </li>
  <li>
    <a href="">selected</a>
    <div>Indicates whether the option is currently selected.</div>
  </li>
  <li>
    <a href="">text</a>
    <div>Contains the text content of the element.</div>
  </li>
  <li>
    <a href="">value</a>
    <div>Reflects the value of the <code><a href="/en-US/docs/Web/HTML/Element/option#attr-value">value</a></code> HTML attribute, if it exists; otherwise reflects value of the <a href="/en-US/docs/Web/API/Node/textContent" title="The textContent property of the Node interface represents the text content of the node and its descendants."><code>Node.textContent</code></a> property.</div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
