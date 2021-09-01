# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> Request

## Properties

### .cache <div class="specs"><i>W3C</i></div> {#cache}

Needs content.

#### **Type**: `Promise<RequestCache>`

### .credentials <div class="specs"><i>W3C</i></div> {#credentials}

Needs content.

#### **Type**: `Promise<RequestCredentials>`

### .destination <div class="specs"><i>W3C</i></div> {#destination}

Needs content.

#### **Type**: `Promise<RequestDestination>`

### .headers <div class="specs"><i>W3C</i></div> {#headers}

Needs content.

#### **Type**: [`Headers`](/docs/awaited-dom/headers)

### .integrity <div class="specs"><i>W3C</i></div> {#integrity}

Needs content.

#### **Type**: `Promise<string>`

### .isHistoryNavigation <div class="specs"><i>W3C</i></div> {#isHistoryNavigation}

Needs content.

#### **Type**: `Promise<boolean>`

### .isReloadNavigation <div class="specs"><i>W3C</i></div> {#isReloadNavigation}

Needs content.

#### **Type**: `Promise<boolean>`

### .keepalive <div class="specs"><i>W3C</i></div> {#keepalive}

Needs content.

#### **Type**: `Promise<boolean>`

### .method <div class="specs"><i>W3C</i></div> {#method}

Needs content.

#### **Type**: `Promise<string>`

### .mode <div class="specs"><i>W3C</i></div> {#mode}

Needs content.

#### **Type**: `Promise<RequestMode>`

### .redirect <div class="specs"><i>W3C</i></div> {#redirect}

Needs content.

#### **Type**: `Promise<RequestRedirect>`

### .referrer <div class="specs"><i>W3C</i></div> {#referrer}

Needs content.

#### **Type**: `Promise<string>`

### .referrerPolicy <div class="specs"><i>W3C</i></div> {#referrerPolicy}

Needs content.

#### **Type**: `Promise<ReferrerPolicy>`

### .url <div class="specs"><i>W3C</i></div> {#url}

Needs content.

#### **Type**: `Promise<string>`

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

|     |     |
| --- | --- |
| `signal` | `body` |

#### Methods

|     |     |
| --- | --- |
| `clone()` | `blob()` |
| `formData()` |  |
