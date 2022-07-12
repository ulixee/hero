# [AwaitedDOM](/docs/hero/basic-client/awaited-dom) <span>/</span> DOMTokenList

<div class='overview'><span class="seoSummary">The <code><strong>DOMTokenList</strong></code> interface represents a set of space-separated tokens. Such a set is returned by <code>Element.classList</code>, <code>HTMLLinkElement.relList</code>, <code>HTMLAnchorElement.relList</code>, <code>HTMLAreaElement.relList</code>, <code>HTMLIframeElement.sandbox</code>, or <code>HTMLOutputElement.htmlFor</code>. It is indexed beginning with <code>0</code> as with JavaScript <code>Array</code> objects. <code>DOMTokenList</code> is always case-sensitive.</span></div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Is an <code>integer</code> representing the number of objects stored in the object.

#### **Type**: `Promise<number>`

### .value <div class="specs"><i>W3C</i></div> {#value}

A stringifier property that returns the value of the list as a `string`.

#### **Type**: `Promise<string>`

## Methods

### .add *(...tokens)* <div class="specs"><i>W3C</i></div> {#add}

Adds the specified&nbsp;<code><var>token</var></code>(s) to the list.

#### **Arguments**:


 - tokens `string`. A `string` representing the token (or tokens) to add to the <code><var>tokenList</var></code>.

#### **Returns**: `Promise<void>`

### .contains *(token)* <div class="specs"><i>W3C</i></div> {#contains}

Returns <code>true</code> if the list contains the given <code><var>token</var></code>, otherwise <code>false</code>.

#### **Arguments**:


 - token `string`. A `string` representing the token you want to check for the existance of in the list.

#### **Returns**: `Promise<boolean>`

### .entries *()* <div class="specs"><i>W3C</i></div> {#entries}

Returns an <code>iterator</code>, allowing you to go through all key/value pairs contained in this object.

#### **Returns**: `Promise<>`

### .forEach *()* <div class="specs"><i>W3C</i></div> {#forEach}

Executes a provided <code><var>callback</var></code> function once per <code>DOMTokenList</code> element.

#### **Returns**: `Promise<>`

### .item *(index)* <div class="specs"><i>W3C</i></div> {#item}

Returns the item in the list by its <code><var>index</var></code>, or <code>undefined</code> if <code><var>index</var></code> is greater than or equal to the list's <code>length</code>.

#### **Arguments**:


 - index `number`. A `string` representing the index of the item you want to return.

#### **Returns**: `Promise<string>`

### .keys *()* <div class="specs"><i>W3C</i></div> {#keys}

Returns an <code>iterator</code>, allowing you to go through all keys of the key/value pairs contained in this object.

#### **Returns**: `Promise<>`

### .remove *(...tokens)* <div class="specs"><i>W3C</i></div> {#remove}

Removes the specified <code><var>token</var></code>(s) from the list.

#### **Arguments**:


 - tokens `string`. A `string` representing the token you want to remove from the list. If the string is not in the list, no error is thrown, and nothing happens.

#### **Returns**: `Promise<void>`

### .replace *(token, newToken)* <div class="specs"><i>W3C</i></div> {#replace}

Replaces&nbsp;<code><var>token</var></code> with&nbsp;<code><var>newToken</var></code>.

#### **Arguments**:


 - token `string`. A `string` representing the token you want to replace.
 - newToken `string`. A `string` representing the token you want to replace <code><var>oldToken</var></code> with.

#### **Returns**: `Promise<boolean>`

### .supports *(token)* <div class="specs"><i>W3C</i></div> {#supports}

Returns <code>true</code> if a given <code><var>token</var></code> is in the associated attribute's supported tokens.

#### **Arguments**:


 - token `string`. A `string` containing the token to query for.

#### **Returns**: `Promise<boolean>`

### .toggle *(token, force?)* <div class="specs"><i>W3C</i></div> {#toggle}

Removes&nbsp;<code><var>token</var></code> from the list if it exists, or adds <code><var>token</var></code> to the list if it doesn't. Returns a boolean indicating whether <code><var>token</var></code> is in the list after the operation.

#### **Arguments**:


 - token `string`. A `string` representing the token you want to toggle.
 - force `boolean`. A `boolean` that, if included, turns the toggle into a one way-only operation. If set to <code>false</code>, then <code><var>token</var></code> will *only* be removed, but not added. If set to <code>true</code>, then <code><var>token</var></code> will *only* be added, but not removed.

#### **Returns**: `Promise<boolean>`

### .values *()* <div class="specs"><i>W3C</i></div> {#values}

Returns an <code>iterator</code>, allowing you to go through all values of the key/value pairs contained in this object.

#### **Returns**: `Promise<>`
