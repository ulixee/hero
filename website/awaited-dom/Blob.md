# Blob

<div class='overview'>The <strong><code>Blob</code></strong> object represents a blob, which is a file-like object of immutable, raw data; they can be read as text or binary data, or converted into a <a href="/en-US/docs/Web/API/ReadableStream" title="The ReadableStream interface of the&nbsp;Streams API&nbsp;represents a readable stream of byte data. The Fetch API offers a concrete instance of a ReadableStream through the body property of a Response object."><code>ReadableStream</code></a> so its methods can be used for processing the data.</div>

<div class='overview'>Blobs can represent data that isn't necessarily in a JavaScript-native format. The <a href="/en-US/docs/Web/API/File" title="The File interface provides information about files and allows JavaScript in a web page to access their content."><code>File</code></a> interface is based on <code>Blob</code>, inheriting blob functionality and expanding it to support files on the user's system.</div>

## Properties

### .size <div class="specs"><i>W3C</i></div> {#size}

The size, in bytes, of the data contained in the <code>Blob</code> object.

#### **Type**: `SuperDocument`

### .type <div class="specs"><i>W3C</i></div> {#type}

A string indicating the MIME&nbsp;type of the data contained in the <code>Blob</code>. If the type is unknown, this string is empty.

#### **Type**: `SuperDocument`

## Methods

### .arrayBuffer*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#arrayBuffer}

Returns a promise that resolves with an <a href="/en-US/docs/Web/API/ArrayBuffer" title="The documentation about this has not yet been written; please consider contributing!"><code>ArrayBuffer</code></a> containing the entire contents of the <code>Blob</code> as binary data.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .slice*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#slice}

Returns a new <code>Blob</code> object containing the data in the specified range of bytes of the blob on which it's called.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .stream*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#stream}

Returns a <a href="/en-US/docs/Web/API/ReadableStream" title="The ReadableStream interface of the&nbsp;Streams API&nbsp;represents a readable stream of byte data. The Fetch API offers a concrete instance of a ReadableStream through the body property of a Response object."><code>ReadableStream</code></a> that can be used to read the contents of the <code>Blob</code>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .text*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#text}

Returns a promise that resolves with a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the entire contents of the <code>Blob</code> interpreted as UTF-8 text.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
