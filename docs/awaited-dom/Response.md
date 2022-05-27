# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> Response

<div class='overview'><span class="seoSummary">The <strong><code>Response</code></strong> interface of the Fetch API represents the response to a request.</span></div>

<div class='overview'>You can create a new <code>Response</code> object using the <code>Response.Response()</code> constructor, but you are more likely to encounter a <code>Response</code> object being returned as the result of another API operation—for example, a service worker <code>Fetchevent.respondWith</code>, or a simple <code>GlobalFetch.fetch()</code>.</div>

## Properties

### .headers <div class="specs"><i>W3C</i></div> {#headers}

The <code>Headers</code> object associated with the response.

#### **Type**: [`Headers`](/docs/awaited-dom/headers)

### .ok <div class="specs"><i>W3C</i></div> {#ok}

A boolean indicating whether the response was successful (status in the range <code>200</code>–<code>299</code>) or not.

#### **Type**: `Promise<boolean>`

### .redirected <div class="specs"><i>W3C</i></div> {#redirected}

Indicates whether or not the response is the result of a redirect (that is, its URL list has more than one entry).

#### **Type**: `Promise<boolean>`

### .status <div class="specs"><i>W3C</i></div> {#status}

The status code of the response. (This will be <code>200</code> for a success).

#### **Type**: `Promise<number>`

### .statusText <div class="specs"><i>W3C</i></div> {#statusText}

The status message corresponding to the status code. (e.g., <code>OK</code> for <code>200</code>).

#### **Type**: `Promise<string>`

### .type <div class="specs"><i>W3C</i></div> {#type}

The type of the response (e.g., <code>basic</code>, <code>cors</code>).

#### **Type**: `Promise<ResponseType>`

### .url <div class="specs"><i>W3C</i></div> {#url}

The URL of the response.

#### **Type**: `Promise<string>`

### .bodyUsed <div class="specs"><i>W3C</i></div> {#bodyUsed}

A `boolean` that indicates whether the body has been read.

#### **Type**: `Promise<boolean>`

## Methods

### .arrayBuffer *()* <div class="specs"><i>W3C</i></div> {#arrayBuffer}

Takes a <code>Response</code> stream and reads it to completion. It returns a promise that resolves with an <code>ArrayBuffer</code>.

#### **Returns**: `Promise<ArrayBuffer>`

### .json *()* <div class="specs"><i>W3C</i></div> {#json}

Takes a <code>Response</code> stream and reads it to completion. It returns a promise that resolves with the result of parsing the body text as <code>JSON</code>.

#### **Returns**: `Promise<any>`

### .text *()* <div class="specs"><i>W3C</i></div> {#text}

Takes a <code>Response</code> stream and reads it to completion. It returns a promise that resolves with a `string` (text). The response is <em>always</em> decoded using UTF-8.

#### **Returns**: `Promise<string>`

## Unimplemented Specs

#### Properties

|     |     |
| --- | --- |
| `body` |  |

#### Methods

|     |     |
| --- | --- |
| `clone()` | `error()` |
| `redirect()` | `blob()` |
| `formData()` |  |
