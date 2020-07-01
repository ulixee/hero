# Headers

<div class='overview'><span class="seoSummary">The <strong><code>Headers</code></strong> interface of the <a href="/en-US/docs/Web/API/Fetch_API">Fetch API</a> allows you to perform various actions on <a href="/en-US/docs/Web/HTTP/Headers">HTTP request and response headers</a>. These actions include retrieving, setting, adding to, and removing headers from the list of the request's headers.</span> A <code>Headers</code> object has an associated header list, which is initially empty and consists of zero or more name and value pairs.  <span style="line-height: 19.0909080505371px;">You can add to this using methods like <a href="/en-US/docs/Web/API/Headers/append"><code>append()</code></a> (see <a href="#Examples">Examples</a>.) </span>In all methods of this interface, header names are matched by case-insensitive byte sequence. </div>

<div class='overview'>For security reasons, some headers can only be controlled by the user agent. These headers include the <a href="/en-US/docs/Glossary/Forbidden_header_name">forbidden header names</a>  and <a href="/en-US/docs/Glossary/Forbidden_response_header_name">forbidden response header names</a>.</div>

<div class='overview'>A Headers object also has an associated guard, which takes a value of <code>immutable</code>, <code>request</code>, <code>request-no-cors</code>, <code>response</code>, or <code>none</code>. This affects whether the <a href="/en-US/docs/Web/API/Headers/set"><code>set()</code></a>, <a href="/en-US/docs/Web/API/Headers/delete"><code>delete()</code></a>, and <a href="/en-US/docs/Web/API/Headers/append"><code>append()</code></a> methods will mutate the header. For more information see <a href="/en-US/docs/Glossary/Guard">Guard</a>.</div>

<div class='overview'>You can retrieve a <code>Headers</code> object via the <a href="/en-US/docs/Web/API/Request/headers"><code>Request.headers</code></a> and <a href="/en-US/docs/Web/API/Response/headers"><code>Response.headers</code></a> properties, and create a new <code>Headers</code> object using the <a href="/en-US/docs/Web/API/Headers/Headers"><code>Headers.Headers()</code></a> constructor.</div>

<div class='overview'>An object implementing <code>Headers</code> can directly be used in a <a href="/en-US/docs/Web/JavaScript/Reference/Statements/for...of"><code>for...of</code></a> structure, instead of <a href="/en-US/docs/Web/API/Headers/entries"><code>entries()</code></a>: <code>for (var p of myHeaders)</code> is equivalent to <code>for (var p of myHeaders.entries())</code>.</div>

## Properties

## Methods

### .append*(...args)* <div class="specs"><i>W3C</i></div> {#append}

Appends a new value onto an existing header inside a <code>Headers</code> object, or adds the header if it does not already exist.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .delete*(...args)* <div class="specs"><i>W3C</i></div> {#delete}

Deletes a header from a <code>Headers</code> object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .entries*(...args)* <div class="specs"><i>W3C</i></div> {#entries}

Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols"><code>iterator</code></a> allowing to go through all key/value pairs contained in this object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .forEach*(...args)* <div class="specs"><i>W3C</i></div> {#forEach}

Executes a provided function once for each array element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .get*(...args)* <div class="specs"><i>W3C</i></div> {#get}

Returns a <a href="/en-US/docs/Web/API/ByteString"><code>ByteString</code></a> sequence of all the values of a header within a <code>Headers</code> object with a given name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .has*(...args)* <div class="specs"><i>W3C</i></div> {#has}

Returns a boolean stating whether a <code>Headers</code> object contains a certain header.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .keys*(...args)* <div class="specs"><i>W3C</i></div> {#keys}

Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols"><code>iterator</code></a> allowing you to go through all keys of the key/value pairs contained in this object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .set*(...args)* <div class="specs"><i>W3C</i></div> {#set}

Sets a new value for an existing header inside a <code>Headers</code> object, or adds the header if it does not already exist.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .values*(...args)* <div class="specs"><i>W3C</i></div> {#values}

Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols"><code>iterator</code></a> allowing you to go through all values of the key/value pairs contained in this object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

## Events
