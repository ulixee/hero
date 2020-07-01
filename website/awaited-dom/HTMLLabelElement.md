# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLLabelElement

<div class='overview'>The <strong><code>HTMLLabelElement</code></strong> interface gives access to properties specific to <a href="/en-US/docs/Web/HTML/Element/label" title="The HTML <label> element represents a caption for an item in a user interface."><code>&lt;label&gt;</code></a> elements. It inherits methods and properties from the base <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface.</div>

## Properties

### .control <div class="specs"><i>W3C</i></div> {#control}

Is a <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code>
</a> representing&nbsp;the control with which the label is associated.

#### **Type**: `null`

### .form <div class="specs"><i>W3C</i></div> {#form}

Is a <a href="/en-US/docs/Web/API/HTMLFormElement" title="The HTMLFormElement interface represents a <form> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements."><code>HTMLFormElement</code></a> object representing the form with which the labeled control is associated, or <code>null</code> if there is no associated control, or if that control isn't associated with a form. In other words, this is just a shortcut for <code><em>HTMLLabelElement</em>.control.form
</code>.

#### **Type**: `null`

### .htmlFor <div class="specs"><i>W3C</i></div> {#htmlFor}

Is a string containing the ID of the labeled control. This reflects the <code><a href="/en-US/docs/Web/HTML/Element/label#attr-for">for</a>
</code> attribute.

#### **Type**: `null`
