# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> ShadowRoot

<div class='overview'>The <code><strong>ShadowRoot</strong></code> interface of the Shadow DOM API is the root node of a DOM subtree that is rendered separately from a document's main DOM tree.</div>

<div class='overview'>You can retrieve a reference to an element's shadow root using its <a href="/en-US/docs/Web/API/Element/shadowRoot" title="The Element.shadowRoot&nbsp;read-only property represents the shadow root hosted by the element."><code>Element.shadowRoot</code></a> property, provided it was created using <a href="/en-US/docs/Web/API/Element/attachShadow" title="The Element.attachShadow() method attaches a shadow DOM tree to the specified element and returns a reference to its ShadowRoot."><code>Element.attachShadow()</code></a> with the <code>mode</code> option set to <code>open</code>.</div>

## Properties

### .delegatesFocus <div class="specs"><i>W3C</i></div> {#delegatesFocus}

Returns a boolean that indicates whether delegatesFocus was set when the shadow was attached (see <a href="/en-US/docs/Web/API/Element/attachShadow" title="The Element.attachShadow() method attaches a shadow DOM tree to the specified element and returns a reference to its ShadowRoot."><code>Element.attachShadow()</code>
</a>).

#### **Type**: `null`

### .host <div class="specs"><i>W3C</i></div> {#host}

Returns a reference to the DOM element the <code>ShadowRoot
</code>&nbsp;is attached to.

#### **Type**: `null`

### .innerHTML <div class="specs"><i>W3C</i></div> {#innerHTML}

Sets or returns a reference to the DOM tree inside the <code>ShadowRoot
</code>.

#### **Type**: `null`

### .mode <div class="specs"><i>W3C</i></div> {#mode}

The mode of the <code>ShadowRoot</code> — either <code>open</code> or <code>closed
</code>. This defines whether or not the shadow root's internal features are accessible from JavaScript.

#### **Type**: `null`
