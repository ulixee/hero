# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> Storage

<div class='overview'>The <strong><code>Storage</code></strong> interface of the <a href="/en-US/docs/Web/API/Web_Storage_API">Web Storage API</a> provides access to a particular domain's session or local storage. It allows, for example, the addition, modification, or deletion of stored data items.</div>

<div class='overview'>To manipulate, for instance, the session storage for a domain, a call to <a href="/en-US/docs/Web/API/Window/sessionStorage" title="The sessionStorage property accesses a session Storage object for the current origin. sessionStorage is similar to localStorage; the difference is that while data in localStorage doesn't expire, data in sessionStorage is cleared when the page session ends."><code>Window.sessionStorage</code></a> is made; whereas for local storage the call is made to <a href="/en-US/docs/Web/API/Window/localStorage" title="The read-only localStorage property allows you to access a Storage object for the Document's origin; the stored data is saved across browser sessions."><code>Window.localStorage</code></a>.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns an integer representing the number of data items stored in the <code>Storage
</code> object.

#### **Type**: `number`

## Methods

### .clear*(...args)* <div class="specs"><i>W3C</i></div> {#clear}

When invoked, will empty all keys out of the storage.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### .getItem*(...args)* <div class="specs"><i>W3C</i></div> {#getItem}

When passed a key name, will return that key's value.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### .key*(...args)* <div class="specs"><i>W3C</i></div> {#key}

When passed a number <code>n
</code>, this method will return the name of the nth key in the storage.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### .removeItem*(...args)* <div class="specs"><i>W3C</i></div> {#removeItem}

When passed a key name, will remove that key from the storage.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### .setItem*(...args)* <div class="specs"><i>W3C</i></div> {#setItem}

When passed a key name and value, will add that key to the storage, or update that key's value if it already exists.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true
