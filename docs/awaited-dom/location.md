# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> Location

<div class='overview'>The <strong><code>Location</code></strong> interface represents the location (URL) of the object it is linked to. Changes done on it are reflected on the object it relates to. Both the <code>Document</code> and <code>Window</code> interface have such a linked <code>Location</code>, accessible via <code>Document.location</code> and <code>Window.location</code> respectively.</div>

## Properties

### .hash <div class="specs"><i>W3C</i></div> {#hash}

Is a `string` containing a <code>'#'</code> followed by the fragment identifier of the URL.

#### **Type**: `Promise<string>`

### .host <div class="specs"><i>W3C</i></div> {#host}

Is a `string` containing the host, that is the <em>hostname</em>, a <code>':'</code>, and the <em>port</em> of the URL.

#### **Type**: `Promise<string>`

### .hostname <div class="specs"><i>W3C</i></div> {#hostname}

Is a `string` containing the domain of the URL.

#### **Type**: `Promise<string>`

### .href <div class="specs"><i>W3C</i></div> {#href}

Is a stringifier that returns a `string` containing the entire URL. If changed, the associated document navigates to the new page. It can be set from a different origin than the associated document.

#### **Type**: `Promise<string>`

### .origin <div class="specs"><i>W3C</i></div> {#origin}

Returns a `string` containing the canonical form of the origin of the specific location.

#### **Type**: `Promise<string>`

### .pathname <div class="specs"><i>W3C</i></div> {#pathname}

Is a `string` containing an initial <code>'/'</code> followed by the path of the URL.

#### **Type**: `Promise<string>`

### .port <div class="specs"><i>W3C</i></div> {#port}

Is a `string` containing the port number of the URL.

#### **Type**: `Promise<string>`

### .protocol <div class="specs"><i>W3C</i></div> {#protocol}

Is a `string` containing the protocol scheme of the URL, including the final <code>':'</code>.

#### **Type**: `Promise<string>`

### .search <div class="specs"><i>W3C</i></div> {#search}

Is a `string` containing a <code>'?'</code> followed by the parameters or "querystring" of the URL. Modern browsers provide URLSearchParams and URL.searchParams to make it easy to parse out the parameters from the querystring.

#### **Type**: `Promise<string>`

## Methods

### .assign *(url)* <div class="specs"><i>W3C</i></div> {#assign}

Loads the resource at the URL provided in parameter.

#### **Arguments**:


 - url `string`. Is a `string` containing the URL of the page to navigate to.

#### **Returns**: `Promise<void>`

### .reload *()* <div class="specs"><i>W3C</i></div> {#reload}

Reloads the resource from the current URL. Its optional unique parameter is a `boolean`, which, when it is <code>true</code>, causes the page to always be reloaded from the server. If it is <code>false</code> or not specified, the browser may reload the page from its cache.

#### **Returns**: `Promise<void>`

### .replace *(url)* <div class="specs"><i>W3C</i></div> {#replace}

Replaces the current resource with the one at the provided URL. The difference from the <code>assign()</code> method is that after using <code>replace()</code> the current page will not be saved in session <code>History</code>, meaning the user won't be able to use the <em>back</em> button to navigate to it.

#### **Arguments**:


 - url `string`. Is a `string` containing the URL of the page to navigate to.

#### **Returns**: `Promise<void>`

### .toString *()* <div class="specs"><i>W3C</i></div> {#toString}

Returns a `string` containing the whole URL. It is a synonym for <code>HTMLHyperlinkElementUtils.href</code>, though it can't be used to modify the value.

#### **Returns**: `Promise<string>`
