# DOMException

<div class='overview'><span class="seoSummary">The <code><strong>DOMException</strong></code> interface represents an abnormal event (called an <strong>exception</strong>) which occurs as a result of calling a method or accessing a property of a web API.</span> This is basically how error conditions are described in web APIs.</div>

<div class='overview'>Each exception has a <strong>name</strong>, which is a short "CamelCase" style string identifying the error or abnormal condition.</div>

## Properties

### .code <div class="specs"><i>W3C</i></div> {#code}

Returns a <code>short</code> that contains one of the error code constants, or <code>0</code> if none match. This field is used for historical reasons. New DOM exceptions don't use this anymore: they put this info in the <a href="/en-US/docs/Web/API/DOMException/name" title="The name read-only property of the DOMException interface returns a DOMString that contains one of the strings associated with an error name."><code>DOMException.name</code></a> attribute.

#### **Type**: `null`

### .message <div class="specs"><i>W3C</i></div> {#message}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing a message or description associated with the given <a href="/en-US/docs/Web/API/DOMException#Error_names">error name</a>.

#### **Type**: `null`

### .name <div class="specs"><i>W3C</i></div> {#name}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that contains one of the strings associated with an <a href="#Error_names">error name</a>.

#### **Type**: `null`

## Methods

## Events
