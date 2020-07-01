# HTMLMapElement

<div class='overview'>The <strong><code>HTMLMapElement</code></strong> interface provides special properties and methods (beyond those of the regular object <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface it also has available to it by inheritance) for manipulating the layout and presentation of map elements.</div>

## Properties

### .areas <div class="specs"><i>W3C</i></div> {#areas}

Is a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> representing the <a href="/en-US/docs/Web/HTML/Element/area" title="The HTML <area> element defines a hot-spot region on an image, and optionally associates it with a hypertext link. This element is used only within a <map> element."><code>&lt;area&gt;</code></a> elements associated to this <a href="/en-US/docs/Web/HTML/Element/map" title="The HTML <map> element is used with <area> elements to define an image map (a clickable link area)."><code>&lt;map&gt;</code></a>.

#### **Type**: `SuperDocument`

### .name <div class="specs"><i>W3C</i></div> {#name}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the <a href="/en-US/docs/Web/HTML/Element/map" title="The HTML <map> element is used with <area> elements to define an image map (a clickable link area)."><code>&lt;map&gt;</code></a> element for referencing it other context. If the <code>id</code> attribute is set, this must have the same value; and it cannot be <code>null</code> or empty.

#### **Type**: `SuperDocument`

## Methods

## Events
