# HTMLIFrameElement

<div class='overview'>The <strong><code>HTMLIFrameElement</code></strong> interface provides special properties and methods (beyond those of the <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface it also has available to it by inheritance) for manipulating the layout and presentation of inline frame elements.</div>

## Properties

### .align <div class="specs"><i>W3C</i></div> {#align}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that specifies the alignment of the frame with respect to the surrounding context.

#### **Type**: `null`

### .allow <div class="specs"><i>W3C</i></div> {#allow}

Is a list of origins the the frame is allowed to display content from. This attribute also accepts the values <code>self</code> and&nbsp;<code>src</code> which represent&nbsp;the origin in the iframe's src attribute. The default value is <code>src</code>.

#### **Type**: `null`

### .allowFullscreen <div class="specs"><i>W3C</i></div> {#allowFullscreen}

Is a <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> indicating whether the inline frame is willing to be placed into full screen mode. See <a href="/en-US/docs/DOM/Using_full-screen_mode" title="https://developer.mozilla.org/en/DOM/Using_full-screen_mode">Using full-screen mode</a> for details.

#### **Type**: `null`

### .allowPaymentRequest <div class="specs"><i>W3C</i></div> {#allowPaymentRequest}

Is a <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> indicating whether the <a href="/en-US/docs/Web/API/Payment_Request_API">Payment Request API</a>&nbsp;may be invoked inside a cross-origin iframe.

#### **Type**: `null`

### .contentDocument <div class="specs"><i>W3C</i></div> {#contentDocument}

Returns a <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a>, the active document in the inline frame's nested browsing context.

#### **Type**: `null`

### .contentWindow <div class="specs"><i>W3C</i></div> {#contentWindow}

Returns a <a class="new" href="/en-US/docs/Web/API/WindowProxy" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>WindowProxy</code></a>, the window proxy for the nested browsing context.

#### **Type**: `null`

### .csp <div class="specs"><i>W3C</i></div> {#csp}

Specifies the Content Security Policy that an embedded document must agree to enforce upon itself.

#### **Type**: `null`

### .featurePolicy <div class="specs"><i>W3C</i></div> {#featurePolicy}

Returns the <a href="/en-US/docs/Web/API/FeaturePolicy" title="The documentation about this has not yet been written; please consider contributing!"><code>FeaturePolicy</code></a> interface which provides a simple API for introspecting the feature policies applied to a specific document.

#### **Type**: `null`

### .frameBorder <div class="specs"><i>W3C</i></div> {#frameBorder}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that indicates whether to create borders between frames.

#### **Type**: `null`

### .height <div class="specs"><i>W3C</i></div> {#height}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/iframe#attr-height">height</a></code> HTML&nbsp;attribute, indicating the height of the frame.

#### **Type**: `null`

### .longDesc <div class="specs"><i>W3C</i></div> {#longDesc}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that contains the URI of a long description of the frame.

#### **Type**: `null`

### .marginHeight <div class="specs"><i>W3C</i></div> {#marginHeight}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> being the height of the frame margin.

#### **Type**: `null`

### .marginWidth <div class="specs"><i>W3C</i></div> {#marginWidth}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> being the width of the frame margin.

#### **Type**: `null`

### .name <div class="specs"><i>W3C</i></div> {#name}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/iframe#attr-name">name</a></code> HTML&nbsp;attribute, containing a name by which to refer to the frame.

#### **Type**: `null`

### .referrerPolicy <div class="specs"><i>W3C</i></div> {#referrerPolicy}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/iframe#attr-referrerpolicy">referrerpolicy</a></code> HTML attribute indicating which referrer to use when fetching the linked resource.

#### **Type**: `null`

### .sandbox <div class="specs"><i>W3C</i></div> {#sandbox}

Is a <a class="new" href="/en-US/docs/Web/API/DOMSettableTokenList" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>DOMSettableTokenList</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/iframe#attr-sandbox">sandbox</a></code> HTML&nbsp;attribute, indicating extra restrictions on the behavior of the nested content.

#### **Type**: `null`

### .scrolling <div class="specs"><i>W3C</i></div> {#scrolling}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that indicates whether the browser should provide scrollbars for the frame.

#### **Type**: `null`

### .src <div class="specs"><i>W3C</i></div> {#src}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/iframe#attr-src">src</a></code> HTML&nbsp;attribute, containing the address of the content to be embedded. Note that programatically removing an <code>&lt;iframe&gt;</code>'s src attribute (e.g. via <a href="/en-US/docs/Web/API/Element/removeAttribute" title="The Element method removeAttribute() removes the attribute with the specified name from the element."><code>Element.removeAttribute()</code></a>) causes <code>about:blank</code> to be loaded in the frame in Firefox (from version 65), Chromium-based browsers, and Safari/iOS.

#### **Type**: `null`

### .srcdoc <div class="specs"><i>W3C</i></div> {#srcdoc}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that represents the content to display in the frame.

#### **Type**: `null`

### .width <div class="specs"><i>W3C</i></div> {#width}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/iframe#attr-width">width</a></code>&nbsp;HTML&nbsp;attribute, indicating the width of the frame.

#### **Type**: `null`

## Methods

## Events
