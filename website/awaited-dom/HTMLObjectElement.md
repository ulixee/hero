# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLObjectElement

<div class='overview'>The <strong><code>HTMLObjectElement</code></strong> interface provides special properties and methods (beyond those on the <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface it also has available to it by inheritance) for manipulating the layout and presentation of <a href="/en-US/docs/Web/HTML/Element/object" title="The HTML <object> element represents an external resource, which can be treated as an image, a nested browsing context, or a resource to be handled by a plugin."><code>&lt;object&gt;</code></a> element, representing external resources.</div>

## Properties

### .align <div class="specs"><i>W3C</i></div> {#align}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing an enumerated property indicating alignment of the element's contents with respect to the surrounding context. The possible values are <code>"left"</code>, <code>"right"</code>, <code>"justify"</code>, and <code>"center"
</code>.

#### **Type**: `null`

### .archive <div class="specs"><i>W3C</i></div> {#archive}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-archive">archive</a>
</code> HTML attribute, containing a list of archives for resources for this object.

#### **Type**: `null`

### .border <div class="specs"><i>W3C</i></div> {#border}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-border">border</a>
</code> HTML attribute, specifying the width of a border around the object.

#### **Type**: `null`

### .code <div class="specs"><i>W3C</i></div> {#code}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the name of an applet class file, containing either the applet's subclass, or the path to get to the class, including the class file itself.

#### **Type**: `null`

### .codeBase <div class="specs"><i>W3C</i></div> {#codeBase}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-codebase">codebase</a>
</code> HTML attribute, specifying the base path to use to resolve relative URIs.

#### **Type**: `null`

### .codeType <div class="specs"><i>W3C</i></div> {#codeType}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-codetype">codetype</a>
</code> HTML attribute, specifying the content type of the data.

#### **Type**: `null`

### .contentDocument <div class="specs"><i>W3C</i></div> {#contentDocument}

Returns a <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> representing the active document of the object element's nested browsing context, if any; otherwise <code>null
</code>.

#### **Type**: `null`

### .contentWindow <div class="specs"><i>W3C</i></div> {#contentWindow}

Returns a <a class="new" href="/en-US/docs/Web/API/WindowProxy" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>WindowProxy</code></a> representing the window proxy of the object element's nested browsing context, if any; otherwise <code>null
</code>.

#### **Type**: `null`

### .data <div class="specs"><i>W3C</i></div> {#data}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-data">data</a>
</code> HTML attribute, specifying the address of a resource's data.

#### **Type**: `null`

### .declare <div class="specs"><i>W3C</i></div> {#declare}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-declare">declare</a>
</code> HTML attribute, indicating that this is a declaration, not an instantiation, of the object.

#### **Type**: `null`

### .form <div class="specs"><i>W3C</i></div> {#form}

Retuns a <a href="/en-US/docs/Web/API/HTMLFormElement" title="The HTMLFormElement interface represents a <form> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements."><code>HTMLFormElement</code>
</a> representing the object element's form owner, or null if there isn't one.

#### **Type**: `null`

### .height <div class="specs"><i>W3C</i></div> {#height}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-height">height</a>
</code> HTML attribute, specifying the displayed height of the resource in CSS pixels.

#### **Type**: `null`

### .hspace <div class="specs"><i>W3C</i></div> {#hspace}

Is a <code>long
</code> representing the horizontal space in pixels around the control.

#### **Type**: `null`

### .name <div class="specs"><i>W3C</i></div> {#name}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-name">name</a>
</code> HTML attribute, specifying the name of the browsing context.

#### **Type**: `null`

### .standby <div class="specs"><i>W3C</i></div> {#standby}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-standby">standby</a>
</code> HTML attribute, specifying a message to display while the object loads.

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-type">type</a>
</code> HTML attribute, specifying the MIME type of the resource.

#### **Type**: `null`

### .useMap <div class="specs"><i>W3C</i></div> {#useMap}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-usemap">usemap</a></code> HTML attribute, specifying a <a href="/en-US/docs/Web/HTML/Element/map" title="The HTML <map> element is used with <area> elements to define an image map (a clickable link area)."><code>&lt;map&gt;</code>
</a> element to use.

#### **Type**: `null`

### .validationMessage <div class="specs"><i>W3C</i></div> {#validationMessage}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing a localized message that describes the validation constraints that the control does not satisfy (if any). This is the empty string if the control is not a candidate for constraint validation (<code>willValidate</code> is <code>false
</code>), or it satisfies its constraints.

#### **Type**: `null`

### .validity <div class="specs"><i>W3C</i></div> {#validity}

Returns a <a href="/en-US/docs/Web/API/ValidityState" title="The ValidityState interface represents the validity states that an element can be in, with respect to constraint validation. Together, they help explain why an element's value fails to validate, if it's not valid."><code>ValidityState</code>
</a> with the validity states that this element is in.

#### **Type**: `null`

### .vspace <div class="specs"><i>W3C</i></div> {#vspace}

Is a <code>long
</code> representing the horizontal space in pixels around the control.

#### **Type**: `null`

### .width <div class="specs"><i>W3C</i></div> {#width}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/object#attr-width">width</a>
</code> HTML attribute, specifying the displayed width of the resource in CSS pixels.

#### **Type**: `null`

### .willValidate <div class="specs"><i>W3C</i></div> {#willValidate}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that indicates whether the element is a candidate for constraint validation. Always <code>false</code> for <code>HTMLObjectElement
</code> objects.

#### **Type**: `null`

## Methods

### .checkValidity*(...args)* <div class="specs"><i>W3C</i></div> {#checkValidity}

Retuns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that always is <code>true</code>, because <code>object
</code> objects are never candidates for constraint validation.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .reportValidity*(...args)* <div class="specs"><i>W3C</i></div> {#reportValidity}

Returns true if the element's value has no validity problems; otherwise, returns false, fires an invalid event at the element, and (if the event isn't canceled) reports the problem to the user.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setCustomValidity*(...args)* <div class="specs"><i>W3C</i></div> {#setCustomValidity}

Sets a custom validity message for the element. If this message is not the empty string, then the element is suffering from a custom validity error, and does not validate.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
