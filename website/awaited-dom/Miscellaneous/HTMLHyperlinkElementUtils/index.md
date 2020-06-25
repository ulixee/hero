# HTMLHyperlinkElementUtils

<div class='overview'><strong>This is an <a href="/en-US/docs/MDN/Contribute/Guidelines/Conventions_definitions#Experimental">experimental technology</a></strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">hash</a>
    <div>This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing a <code>'#'</code> followed by the fragment identifier of the URL.</div>
  </li>
  <li>
    <a href="">host</a>
    <div>This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the host, that is the <em>hostname</em>, and then, if the <em>port</em> of the URL is not empty (which can happen because it was not specified or because it was specified to be the default port of the URL's scheme), a <code>':'</code>, and the <em>port</em> of the URL.</div>
  </li>
  <li>
    <a href="">hostname</a>
    <div>This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the domain of the URL.</div>
  </li>
  <li>
    <a href="">href</a>
    <div>This a stringifier property that returns a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the whole URL, and allows the href to be updated.</div>
  </li>
  <li>
    <a href="">origin</a>
    <div>This returns a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the origin of the URL (that is its scheme, its domain and its port).</div>
  </li>
  <li>
    <a href="">password</a>
    <div>This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the password specified before the domain name.</div>
  </li>
  <li>
    <a href="">pathname</a>
    <div>This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing an initial <code>'/'</code> followed by the path of the URL.</div>
  </li>
  <li>
    <a href="">port</a>
    <div>This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the port number of the URL.</div>
  </li>
  <li>
    <a href="">protocol</a>
    <div>This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the protocol scheme of the URL, including the final <code>':'</code>.</div>
  </li>
  <li>
    <a href="">search</a>
    <div>This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing a <code>'?'</code> followed by the parameters of the URL.</div>
  </li>
  <li>
    <a href="">username</a>
    <div>This is a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the username specified before the domain name.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">toString()</a>
    <div>This returns a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> containing the whole URL. It is a synonym for <a href="/en-US/docs/Web/API/HTMLHyperlinkElementUtils/href" title="The HTMLHyperlinkElementUtils.href property is a stringifier that returns a USVString containing the whole URL, and allows the href to be updated."><code>HTMLHyperlinkElementUtils.href</code></a>, though it can't be used to modify the value.</div>
  </li>
</ul>

## Events
