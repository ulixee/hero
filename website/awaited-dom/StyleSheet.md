# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> StyleSheet

<div class='overview'>An object implementing the <code>StyleSheet</code> interface represents a single style sheet. CSS style sheets will further implement the more specialized <a href="/en-US/docs/Web/API/CSSStyleSheet" title="The CSSStyleSheet interface represents a single CSS stylesheet, and lets you inspect and modify the list of rules contained in the stylesheet."><code>CSSStyleSheet</code></a> interface.</div>

## Properties

### .disabled <div class="specs"><i>W3C</i></div> {#disabled}

Is a <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code>
</a> representing whether the current stylesheet has been applied or not.

#### **Type**: `null`

### .href <div class="specs"><i>W3C</i></div> {#href}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the location of the stylesheet.

#### **Type**: `null`

### .media <div class="specs"><i>W3C</i></div> {#media}

Returns a <a href="/en-US/docs/Web/API/MediaList" title="The MediaList interface represents the media queries of a stylesheet, e.g. those set using a <link> element's media attribute."><code>MediaList</code>
</a> representing the intended destination medium for style information.

#### **Type**: `null`

### .ownerNode <div class="specs"><i>W3C</i></div> {#ownerNode}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code>
</a> associating this style sheet with the current document.

#### **Type**: `null`

### .parentStyleSheet <div class="specs"><i>W3C</i></div> {#parentStyleSheet}

Returns a <a href="/en-US/docs/Web/API/StyleSheet" title="An object implementing the StyleSheet interface represents a single style sheet. CSS style sheets will further implement the more specialized CSSStyleSheet interface."><code>StyleSheet</code></a> including this one, if any; returns <code>null
</code> if there aren't any.

#### **Type**: `null`

### .title <div class="specs"><i>W3C</i></div> {#title}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the advisory title of the current style sheet.

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the style sheet language for this style sheet.

#### **Type**: `null`
