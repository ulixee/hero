# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> Storage

<div class='overview'>The <strong><code>Storage</code></strong> interface of the Web Storage API provides access to a particular domain's session or local storage. It allows, for example, the addition, modification, or deletion of stored data items.</div>

<div class='overview'>To manipulate, for instance, the session storage for a domain, a call to <code>Window.sessionStorage</code> is made; whereas for local storage the call is made to <code>Window.localStorage</code>.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns an integer representing the number of data items stored in the <code>Storage</code> object.

#### **Type**: `Promise<number>`

## Methods

### .clear*()* <div class="specs"><i>W3C</i></div> {#clear}

When invoked, will empty all keys out of the storage.

#### **Returns**: `Promise<undefined>`

### .getItem*(key)* <div class="specs"><i>W3C</i></div> {#getItem}

When passed a key name, will return that key's value.

#### **Arguments**:


 - key `string`. A `string` containing the name of the key you want to retrieve the value of.

#### **Returns**: `Promise<string>`

### .key*(index)* <div class="specs"><i>W3C</i></div> {#key}

When passed a number <code>n</code>, this method will return the name of the nth key in the storage.

#### **Arguments**:


 - index `number`. An integer representing the number of the key you want to get the name of. This is a zero-based index.

#### **Returns**: `Promise<string>`

### .removeItem*(key)* <div class="specs"><i>W3C</i></div> {#removeItem}

When passed a key name, will remove that key from the storage.

#### **Arguments**:


 - key `string`. A `string` containing the name of the key you want to remove.

#### **Returns**: `Promise<undefined>`

### .setItem*(key, value)* <div class="specs"><i>W3C</i></div> {#setItem}

When passed a key name and value, will add that key to the storage, or update that key's value if it already exists.

#### **Arguments**:


 - key `string`. A `string` containing the name of the key you want to create/update.
 - value `string`. A `string` containing the value you want to give the key you are creating/updating.

#### **Returns**: `Promise<undefined>`
