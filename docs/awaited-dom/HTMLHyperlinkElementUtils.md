# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> HTMLHyperlinkElementUtils

<div class='overview'><strong>This is an experimental technology</strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

### .hash <div class="specs"><i>W3C</i></div> {#hash}

This is a `string` containing a <code>'#'</code> followed by the fragment identifier of the URL.

#### **Type**: `Promise<string>`

### .host <div class="specs"><i>W3C</i></div> {#host}

This is a `string` containing the host, that is the <em>hostname</em>, and then, if the <em>port</em> of the URL is not empty (which can happen because it was not specified or because it was specified to be the default port of the URL's scheme), a <code>':'</code>, and the <em>port</em> of the URL.

#### **Type**: `Promise<string>`

### .hostname <div class="specs"><i>W3C</i></div> {#hostname}

This is a `string` containing the domain of the URL.

#### **Type**: `Promise<string>`

### .href <div class="specs"><i>W3C</i></div> {#href}

This a stringifier property that returns a `string` containing the whole URL, and allows the href to be updated.

#### **Type**: `Promise<string>`

### .origin <div class="specs"><i>W3C</i></div> {#origin}

This returns a `string` containing the origin of the URL (that is its scheme, its domain and its port).

#### **Type**: `Promise<string>`

### .password <div class="specs"><i>W3C</i></div> {#password}

This is a `string` containing the password specified before the domain name.

#### **Type**: `Promise<string>`

### .pathname <div class="specs"><i>W3C</i></div> {#pathname}

This is a `string` containing an initial <code>'/'</code> followed by the path of the URL.

#### **Type**: `Promise<string>`

### .port <div class="specs"><i>W3C</i></div> {#port}

This is a `string` containing the port number of the URL.

#### **Type**: `Promise<string>`

### .protocol <div class="specs"><i>W3C</i></div> {#protocol}

This is a `string` containing the protocol scheme of the URL, including the final <code>':'</code>.

#### **Type**: `Promise<string>`

### .search <div class="specs"><i>W3C</i></div> {#search}

This is a `string` containing a <code>'?'</code> followed by the parameters of the URL.

#### **Type**: `Promise<string>`

### .username <div class="specs"><i>W3C</i></div> {#username}

This is a `string` containing the username specified before the domain name.

#### **Type**: `Promise<string>`

## Methods

### .toString *()* <div class="specs"><i>W3C</i></div> {#toString}

This returns a `string` containing the whole URL. It is a synonym for <code>HTMLHyperlinkElementUtils.href</code>, though it can't be used to modify the value.

#### **Returns**: `Promise<string>`
