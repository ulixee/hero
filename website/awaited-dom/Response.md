# Response

<div class='overview'><span class="seoSummary">The <strong><code>Response</code></strong> interface of the <a href="/en-US/docs/Web/API/Fetch_API">Fetch API</a> represents the response to a request.</span></div>

<div class='overview'>You can create a new <code>Response</code> object using the <a href="/en-US/docs/Web/API/Response/Response"><code>Response.Response()</code></a> constructor, but you are more likely to encounter a <code>Response</code> object being returned as the result of another API operation—for example, a service worker <a href="/en-US/docs/Web/API/Fetchevent/respondWith"><code>Fetchevent.respondWith</code></a>, or a simple <a href="/en-US/docs/Web/API/GlobalFetch/fetch"><code>GlobalFetch.fetch()</code></a>.</div>

## Properties

### .headers <div class="specs"><i>W3C</i></div> {#headers}

The <a href="/en-US/docs/Web/API/Headers"><code>Headers</code></a> object associated with the response.

#### **Type**: `null`

### .ok <div class="specs"><i>W3C</i></div> {#ok}

A boolean indicating whether the response was successful (status in the range <code>200</code>–<code>299</code>) or not.

#### **Type**: `null`

### .redirected <div class="specs"><i>W3C</i></div> {#redirected}

Indicates whether or not the response is the result of a redirect (that is, its URL list has more than one entry).

#### **Type**: `null`

### .status <div class="specs"><i>W3C</i></div> {#status}

The status code of the response. (This will be <code>200</code> for a success).

#### **Type**: `null`

### .statusText <div class="specs"><i>W3C</i></div> {#statusText}

The status message corresponding to the status code. (e.g., <code>OK</code> for <code>200</code>).

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

The type of the response (e.g., <code>basic</code>, <code>cors</code>).

#### **Type**: `null`

### .url <div class="specs"><i>W3C</i></div> {#url}

The URL of the response.

#### **Type**: `null`

## Methods

### .clone*(...args)* <div class="specs"><i>W3C</i></div> {#clone}

Creates a clone of a <code>Response</code> object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .error*(...args)* <div class="specs"><i>W3C</i></div> {#error}

Returns a new <code>Response</code> object associated with a network error.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .redirect*(...args)* <div class="specs"><i>W3C</i></div> {#redirect}

Creates a new response with a different URL.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

## Events
