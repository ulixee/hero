# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> File

<div class='overview'>The <strong><code>File</code></strong> interface provides information about files and allows JavaScript in a web page to access their content.</div>

<div class='overview'><code>File</code> objects are generally retrieved from a <code>FileList</code> object returned as a result of a user selecting files using the&nbsp;<code>&lt;input&gt;</code>&nbsp;element, from a drag and drop operation's <code>DataTransfer</code> object, or from the&nbsp;<code>mozGetAsFile()</code>&nbsp;API on an&nbsp;<code>HTMLCanvasElement</code>.</div>

<div class='overview'>A <code>File</code> object is a specific kind of a <code>Blob</code>, and can be used in any context that a Blob can. In particular, <code>FileReader</code>, <code>URL.createObjectURL()</code>, <code>createImageBitmap()</code>, and <code>XMLHttpRequest.send()</code> accept both <code>Blob</code>s and <code>File</code>s.</div>

<div class='overview'>See Using files from web applications for more information and examples.</div>

## Properties

### .lastModified <div class="specs"><i>W3C</i></div> {#lastModified}

Returns the last modified time of the file, in millisecond since the UNIX epoch (January 1st, 1970 at Midnight).

#### **Type**: `Promise<number>`

### .name <div class="specs"><i>W3C</i></div> {#name}

Returns the name of the file referenced by the <code>File</code> object.

#### **Type**: `Promise<string>`

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
