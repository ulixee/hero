# HTMLProgressElement

<div class='overview'>The <strong><code>HTMLProgressElement</code></strong> interface provides special properties and methods (beyond the regular <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface it also has available to it by inheritance) for manipulating the layout and presentation of <a href="/en-US/docs/Web/HTML/Element/progress" title="The HTML <progress> element displays an indicator showing the completion progress of a task, typically displayed as a progress bar."><code>&lt;progress&gt;</code></a> elements.</div>

## Properties

### .labels <div class="specs"><i>W3C</i></div> {#labels}

Returns <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> containing the list of <a href="/en-US/docs/Web/HTML/Element/label" title="The HTML <label> element represents a caption for an item in a user interface."><code>&lt;label&gt;</code></a> elements that are labels for this element.

#### **Type**: `SuperDocument`

### .max <div class="specs"><i>W3C</i></div> {#max}

Is a <code>double</code> value reflecting the content attribute of the same name, limited to numbers greater than zero. Its default value is <code>1.0</code>.

#### **Type**: `SuperDocument`

### .position <div class="specs"><i>W3C</i></div> {#position}

Returns a <code>double</code> value returning the result of dividing the current value (<code>value</code>) by the maximum value (<code>max</code>); if the progress bar is an indeterminate progress bar, it returns <code>-1</code>.

#### **Type**: `SuperDocument`

### .value <div class="specs"><i>W3C</i></div> {#value}

Is a <code>double</code> value that reflects the current value; if the progress bar is an indeterminate progress bar, it returns <code>0</code>.

#### **Type**: `SuperDocument`

## Methods

## Events
