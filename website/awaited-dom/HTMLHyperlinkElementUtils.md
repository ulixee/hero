# HTMLHyperlinkElementUtils

<div class='overview'><strong>This is an <a href="/en-US/docs/MDN/Contribute/Guidelines/Conventions_definitions#Experimental">experimental technology</a></strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

### .hash <div class="specs"><i>W3C</i></div> {#hash}

This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing a <code>'#'</code> followed by the fragment identifier of the URL.

#### **Type**: `SuperDocument`

### .host <div class="specs"><i>W3C</i></div> {#host}

This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the host, that is the <em>hostname</em>, and then, if the <em>port</em> of the URL is not empty (which can happen because it was not specified or because it was specified to be the default port of the URL's scheme), a <code>':'</code>, and the <em>port</em> of the URL.

#### **Type**: `SuperDocument`

### .hostname <div class="specs"><i>W3C</i></div> {#hostname}

This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the domain of the URL.

#### **Type**: `SuperDocument`

### .href <div class="specs"><i>W3C</i></div> {#href}

This a stringifier property that returns a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the whole URL, and allows the href to be updated.

#### **Type**: `SuperDocument`

### .origin <div class="specs"><i>W3C</i></div> {#origin}

This returns a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the origin of the URL (that is its scheme, its domain and its port).

#### **Type**: `SuperDocument`

### .password <div class="specs"><i>W3C</i></div> {#password}

This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the password specified before the domain name.

#### **Type**: `SuperDocument`

### .pathname <div class="specs"><i>W3C</i></div> {#pathname}

This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing an initial <code>'/'</code> followed by the path of the URL.

#### **Type**: `SuperDocument`

### .port <div class="specs"><i>W3C</i></div> {#port}

This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the port number of the URL.

#### **Type**: `SuperDocument`

### .protocol <div class="specs"><i>W3C</i></div> {#protocol}

This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the protocol scheme of the URL, including the final <code>':'</code>.

#### **Type**: `SuperDocument`

### .search <div class="specs"><i>W3C</i></div> {#search}

This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing a <code>'?'</code> followed by the parameters of the URL.

#### **Type**: `SuperDocument`

### .username <div class="specs"><i>W3C</i></div> {#username}

This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the username specified before the domain name.

#### **Type**: `SuperDocument`

## Methods

### .toString*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#toString}

This returns a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the whole URL. It is a synonym for <a href="/en-US/docs/Web/API/HTMLHyperlinkElementUtils/href" title="The HTMLHyperlinkElementUtils.href property is a stringifier that returns a USVString containing the whole URL, and allows the href to be updated."><code>HTMLHyperlinkElementUtils.href</code></a>, though it can't be used to modify the value.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
