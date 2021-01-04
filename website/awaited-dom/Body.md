# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> Body

<div class='overview'><span class="seoSummary">The <strong><code>Body</code></strong> mixin of the Fetch API represents the body of the response/request, allowing you to declare what its content type is and how it should be handled.</span></div>

<div class='overview'><code>Body</code> is implemented by both <code>Request</code> and <code>Response</code>. This provides these objects with an associated <dfn>body</dfn> (a stream), a <dfn>used flag</dfn> (initially unset), and a <dfn>MIME type</dfn> (initially the empty byte sequence).</div>

## Properties

### .bodyUsed <div class="specs"><i>W3C</i></div> {#bodyUsed}

A `boolean` that indicates whether the body has been read.

#### **Type**: `Promise<boolean>`

## Methods

### .arrayBuffer*()* <div class="specs"><i>W3C</i></div> {#arrayBuffer}

Takes a <code>Response</code> stream and reads it to completion. It returns a promise that resolves with an <code>ArrayBuffer</code>.

#### **Returns**: `Promise<ArrayBuffer>`

### .json*()* <div class="specs"><i>W3C</i></div> {#json}

Takes a <code>Response</code> stream and reads it to completion. It returns a promise that resolves with the result of parsing the body text as <code>JSON</code>.

#### **Returns**: `Promise<any>`

### .text*()* <div class="specs"><i>W3C</i></div> {#text}

Takes a <code>Response</code> stream and reads it to completion. It returns a promise that resolves with a `string` (text). The response is <em>always</em> decoded using UTF-8.

#### **Returns**: `Promise<string>`

## Unimplemented Specs

#### Properties

 |   |   | 
 | --- | --- | 
 | `body` |  | 

#### Methods

 |   |   | 
 | --- | --- | 
 | `blob()` | `formData()` | 
