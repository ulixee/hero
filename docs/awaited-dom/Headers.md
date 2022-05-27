# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> Headers

<div class='overview'><span class="seoSummary">The <strong><code>Headers</code></strong> interface of the Fetch API allows you to perform various actions on HTTP request and response headers. These actions include retrieving, setting, adding to, and removing headers from the list of the request's headers.</span> A <code>Headers</code> object has an associated header list, which is initially empty and consists of zero or more name and value pairs.  <span style="line-height: 19.0909080505371px;">You can add to this using methods like <code>append()</code> (see <a href="#Examples">Examples</a>.) </span>In all methods of this interface, header names are matched by case-insensitive byte sequence. </div>

<div class='overview'>For security reasons, some headers can only be controlled by the user agent. These headers include the forbidden header names  and forbidden response header names.</div>

<div class='overview'>A Headers object also has an associated guard, which takes a value of <code>immutable</code>, <code>request</code>, <code>request-no-cors</code>, <code>response</code>, or <code>none</code>. This affects whether the <code>set()</code>, <code>delete()</code>, and <code>append()</code> methods will mutate the header. For more information see Guard.</div>

<div class='overview'>You can retrieve a <code>Headers</code> object via the <code>Request.headers</code> and <code>Response.headers</code> properties, and create a new <code>Headers</code> object using the <code>Headers.Headers()</code> constructor.</div>

<div class='overview'>An object implementing <code>Headers</code> can directly be used in a <code>for...of</code> structure, instead of <code>entries()</code>: <code>for (var p of myHeaders)</code> is equivalent to <code>for (var p of myHeaders.entries())</code>.</div>

## Methods

### .append *(name, value)* <div class="specs"><i>W3C</i></div> {#append}

Appends a new value onto an existing header inside a <code>Headers</code> object, or adds the header if it does not already exist.

#### **Arguments**:


 - name `string`. The name of the HTTP header you want to add to the <code>Headers</code> object.
 - value `string`. The value of the HTTP header you want to add.

#### **Returns**: `Promise<void>`

### .delete *(name)* <div class="specs"><i>W3C</i></div> {#delete}

Deletes a header from a <code>Headers</code> object.

#### **Arguments**:


 - name `string`. The name of the HTTP header you want to delete from the <code>Headers</code> object.

#### **Returns**: `Promise<void>`

### .entries *()* <div class="specs"><i>W3C</i></div> {#entries}

Returns an <code>iterator</code> allowing to go through all key/value pairs contained in this object.

#### **Returns**: `Promise<>`

### .forEach *()* <div class="specs"><i>W3C</i></div> {#forEach}

Executes a provided function once for each array element.

#### **Returns**: `Promise<>`

### .get *(name)* <div class="specs"><i>W3C</i></div> {#get}

Returns a <code>ByteString</code> sequence of all the values of a header within a <code>Headers</code> object with a given name.

#### **Arguments**:


 - name `string`. The name of the HTTP header whose values you want to retrieve from the <code>Headers</code> object. If the given name is not the name of an HTTP header, this method throws a <code>TypeError</code>. The name is case-insensitive.

#### **Returns**: `Promise<string>`

### .has *(name)* <div class="specs"><i>W3C</i></div> {#has}

Returns a boolean stating whether a <code>Headers</code> object contains a certain header.

#### **Arguments**:


 - name `string`. The name of the HTTP header you want to test for. If the given name is not a valid HTTP header name, this method throws a <code>TypeError</code>.

#### **Returns**: `Promise<boolean>`

### .keys *()* <div class="specs"><i>W3C</i></div> {#keys}

Returns an <code>iterator</code> allowing you to go through all keys of the key/value pairs contained in this object.

#### **Returns**: `Promise<>`

### .set *(name, value)* <div class="specs"><i>W3C</i></div> {#set}

Sets a new value for an existing header inside a <code>Headers</code> object, or adds the header if it does not already exist.

#### **Arguments**:


 - name `string`. The name of the HTTP header you want to set to a new value. If the given name is not the name of an HTTP header, this method throws a <code>TypeError</code>.
 - value `string`. The new value you want to set.

#### **Returns**: `Promise<void>`

### .values *()* <div class="specs"><i>W3C</i></div> {#values}

Returns an <code>iterator</code> allowing you to go through all values of the key/value pairs contained in this object.

#### **Returns**: `Promise<>`
