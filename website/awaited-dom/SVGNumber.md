# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> SVGNumber

<div class='overview'>The <strong><code>SVGNumber</code></strong> interface corresponds to the <a href="/en-US/docs/Web/CSS/number" title="The <number> CSS data type represents a number, being either an integer or a number with a fractional component."><code>&lt;number&gt;</code></a> basic data type.</div>

<div class='overview'>An <code>SVGNumber</code> object can be designated as read only, which means that attempts to modify the object will result in an exception being thrown.</div>

## Properties

### .value <div class="specs"><i>W3C</i></div> {#value}

A float representing the number.
 <p class="note">Note: If the <code>SVGNumber</code> is read-only, a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with the code NO_MODIFICATION_ALLOWED_ERR is raised on an attempt to change the value.</p>
 

#### **Type**: `null`
