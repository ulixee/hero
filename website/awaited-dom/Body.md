# Body

<div class='overview'><span class="seoSummary">The <strong><code>Body</code></strong> <a href="/en-US/docs/Glossary/mixin">mixin</a> of the <a href="/en-US/docs/Web/API/Fetch_API">Fetch API</a> represents the body of the response/request, allowing you to declare what its content type is and how it should be handled.</span></div>

<div class='overview'><code>Body</code> is implemented by both <a href="/en-US/docs/Web/API/Request"><code>Request</code></a> and <a href="/en-US/docs/Web/API/Response"><code>Response</code></a>. This provides these objects with an associated <dfn>body</dfn> (a <a href="/en-US/docs/Web/API/Streams_API">stream</a>), a <dfn>used flag</dfn> (initially unset), and a <dfn>MIME type</dfn> (initially the empty byte sequence).</div>

## Properties

### .body <div class="specs"><i>W3C</i></div> {#body}

A simple getter used to expose a <a href="/en-US/docs/Web/API/ReadableStream"><code>ReadableStream</code></a> of the body contents.

#### **Type**: `null`

### .bodyUsed <div class="specs"><i>W3C</i></div> {#bodyUsed}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean"><code>Boolean</code></a> that indicates whether the body has been read.

#### **Type**: `null`

## Methods

### .arrayBuffer*(...args)* <div class="specs"><i>W3C</i></div> {#arrayBuffer}

Takes a <a href="/en-US/docs/Web/API/Response"><code>Response</code></a> stream and reads it to completion. It returns a promise that resolves with an <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer"><code>ArrayBuffer</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .blob*(...args)* <div class="specs"><i>W3C</i></div> {#blob}

Takes a <a href="/en-US/docs/Web/API/Response"><code>Response</code></a> stream and reads it to completion. It returns a promise that resolves with a <a href="/en-US/docs/Web/API/Blob"><code>Blob</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .formData*(...args)* <div class="specs"><i>W3C</i></div> {#formData}

Takes a <a href="/en-US/docs/Web/API/Response"><code>Response</code></a> stream and reads it to completion. It returns a promise that resolves with a <a href="/en-US/docs/Web/API/FormData"><code>FormData</code></a> object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .json*(...args)* <div class="specs"><i>W3C</i></div> {#json}

Takes a <a href="/en-US/docs/Web/API/Response"><code>Response</code></a> stream and reads it to completion. It returns a promise that resolves with the result of parsing the body text as <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON"><code>JSON</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .text*(...args)* <div class="specs"><i>W3C</i></div> {#text}

Takes a <a href="/en-US/docs/Web/API/Response"><code>Response</code></a> stream and reads it to completion. It returns a promise that resolves with a <a href="/en-US/docs/Web/API/USVString"><code>USVString</code></a> (text). The response is <em>always</em> decoded using UTF-8.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

## Events
