# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> Blob

<div class='overview'>The <strong><code>Blob</code></strong> object represents a blob, which is a file-like object of immutable, raw data; they can be read as text or binary data, or converted into a <code>ReadableStream</code> so its methods can be used for processing the data.</div>

<div class='overview'>Blobs can represent data that isn't necessarily in a JavaScript-native format. The <code>File</code> interface is based on <code>Blob</code>, inheriting blob functionality and expanding it to support files on the user's system.</div>

## Properties

### .size <div class="specs"><i>W3C</i></div> {#size}

The size, in bytes, of the data contained in the <code>Blob</code> object.

#### **Type**: `Promise<number>`

### .type <div class="specs"><i>W3C</i></div> {#type}

A string indicating the MIME&nbsp;type of the data contained in the <code>Blob</code>. If the type is unknown, this string is empty.

#### **Type**: `Promise<string>`

## Methods

### .arrayBuffer*()* <div class="specs"><i>W3C</i></div> {#arrayBuffer}

Returns a promise that resolves with an <code>ArrayBuffer</code> containing the entire contents of the <code>Blob</code> as binary data.

#### **Returns**: `Promise<ArrayBuffer>`

### .slice*(start?, end?, contentType?)* <div class="specs"><i>W3C</i></div> {#slice}

Returns a new <code>Blob</code> object containing the data in the specified range of bytes of the blob on which it's called.

#### **Arguments**:


 - start `number`. An index into the <code>Blob</code> indicating the first byte to include in the new <code>Blob</code>. If you specify a negative value, it's treated as an offset from the end of the <code>Blob</code> toward the beginning. For example, -10 would be the 10th from last byte in the <code>Blob</code>. The default value is 0. If you specify a value for <code>start</code> that is larger than the size of the source <code>Blob</code>, the returned <code>Blob</code> has size 0 and contains no data.
 - end `number`. An index into the <code>Blob</code> indicating the first byte that will *not* be included in the new <code>Blob</code> (i.e. the byte exactly at this index is not included). If you specify a negative value, it's treated as an offset from the end of the <code>Blob</code> toward the beginning. For example, -10 would be the 10th from last byte in the <code>Blob</code>. The default value is <code>size</code>.
 - contentType `string`. The content type to assign to the new <code>Blob</code>; this will be the value of its <code>type</code> property. The default value is an empty string.

#### **Returns**: `Promise<Blob>`

### .text*()* <div class="specs"><i>W3C</i></div> {#text}

Returns a promise that resolves with a `string` containing the entire contents of the <code>Blob</code> interpreted as UTF-8 text.

#### **Returns**: `Promise<string>`

## Unimplemented Specs

#### Methods

 |   |   | 
 | --- | --- | 
 | `stream()` |  | 
