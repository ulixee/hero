# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> DOMImplementation

<div class='overview'>The <code><strong>DOMImplementation</strong></code> interface represents an object providing methods which are not dependent on any particular document. Such an object is returned by the <code>Document.implementation</code> property.</div>

## Methods

### .hasFeature*()* <div class="specs"><i>W3C</i></div> {#hasFeature}

Returns a `boolean` indicating if a given feature is supported or not. This function is unreliable and kept for compatibility purpose alone: except for SVG-related queries, it always returns <code>true</code>. Old browsers are very inconsistent in their behavior.

#### **Returns**: `Promise<boolean>`

## Unimplemented Specs

#### Methods

|     |     |
| --- | --- |
| `createDocument()` | `createDocumentType()`
`createHTMLDocument()` |  |
