# DOMTokenList

<div class='overview'><span class="seoSummary">The <code><strong>DOMTokenList</strong></code> interface represents a set of space-separated tokens. Such a set is returned by <a href="/en-US/docs/Web/API/Element/classList" title="The Element.classList is a read-only property that returns a live DOMTokenList collection of the class attributes of the element. This can then be used to manipulate the class list."><code>Element.classList</code></a>, <a href="/en-US/docs/Web/API/HTMLLinkElement/relList" title="The HTMLLinkElement.relList read-only property reflects the rel attribute. It is a live DOMTokenList containing the set of link types indicating the relationship between the resource represented by the <link> element and the current document."><code>HTMLLinkElement.relList</code></a>, <a href="/en-US/docs/Web/API/HTMLAnchorElement/relList" title="The HTMLAnchorElement.relList read-only property reflects the rel attribute. It is a live DOMTokenList containing the set of link types indicating the relationship between the resource represented by the <a> element and the current document."><code>HTMLAnchorElement.relList</code></a>, <a href="/en-US/docs/Web/API/HTMLAreaElement/relList" title="The HTMLAreaElement.relList read-only property reflects the rel attribute. It is a live DOMTokenList containing the set of link types indicating the relationship between the resource represented by the <area> element and the current document."><code>HTMLAreaElement.relList</code></a>, <a class="new" href="/en-US/docs/Web/API/HTMLIframeElement/sandbox" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>HTMLIframeElement.sandbox</code></a>, or <a class="new" href="/en-US/docs/Web/API/HTMLOutputElement/htmlFor" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>HTMLOutputElement.htmlFor</code></a>. It is indexed beginning with <code>0</code> as with JavaScript <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array" title="The JavaScript Array class is a global object that&nbsp;is used in the&nbsp;construction&nbsp;of&nbsp;arrays; which are high-level, list-like objects."><code>Array</code></a> objects. <code>DOMTokenList</code> is always case-sensitive.</span></div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Is an <code>integer</code> representing the number of objects stored in the object.

#### **Type**: `SuperDocument`

### .value <div class="specs"><i>W3C</i></div> {#value}

A stringifier property that returns the value of the list as a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a>.

#### **Type**: `SuperDocument`

## Methods

### .add*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#add}

Adds the specified&nbsp;<code><var>token</var></code>(s) to the list.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .contains*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#contains}

Returns <code>true</code> if the list contains the given <code><var>token</var></code>, otherwise <code>false</code>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .entries*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#entries}

Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols" title="A couple of additions to ECMAScript 2015 aren't new built-ins or syntax, but protocols. These protocols can be implemented by any object respecting some conventions."><code>iterator</code></a>, allowing you to go through all key/value pairs contained in this object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .forEach*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#forEach}

Executes a provided <code><var>callback</var></code> function once per <code>DOMTokenList</code> element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .item*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#item}

Returns the item in the list by its <code><var>index</var></code>, or <code>undefined</code> if <code><var>index</var></code> is greater than or equal to the list's <code>length</code>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .keys*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#keys}

Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols" title="A couple of additions to ECMAScript 2015 aren't new built-ins or syntax, but protocols. These protocols can be implemented by any object respecting some conventions."><code>iterator</code></a>, allowing you to go through all keys of the key/value pairs contained in this object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .remove*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#remove}

Removes the specified <code><var>token</var></code>(s) from the list.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .replace*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#replace}

Replaces&nbsp;<code><var>token</var></code> with&nbsp;<code><var>newToken</var></code>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .supports*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#supports}

Returns <code>true</code> if a given <code><var>token</var></code> is in the associated attribute's supported tokens.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .toggle*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#toggle}

Removes&nbsp;<code><var>token</var></code> from the list if it exists, or adds <code><var>token</var></code> to the list if it doesn't. Returns a boolean indicating whether <code><var>token</var></code> is in the list after the operation.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .values*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#values}

Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols" title="A couple of additions to ECMAScript 2015 aren't new built-ins or syntax, but protocols. These protocols can be implemented by any object respecting some conventions."><code>iterator</code></a>, allowing you to go through all values of the key/value pairs contained in this object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
