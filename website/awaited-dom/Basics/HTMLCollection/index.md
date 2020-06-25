# HTMLCollection

<div class='overview'>The <strong><code>HTMLCollection</code></strong> interface represents a generic collection (array-like object similar to <a href="/en-US/docs/Web/JavaScript/Reference/Functions/arguments" title="arguments is an Array-like object accessible inside functions that contains the values of the arguments passed to that function."><code>arguments</code></a>) of elements (in document order) and offers methods and properties for selecting from the list.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">length</a>
    <div>Returns the number of items in the collection.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">item()</a>
    <div>Returns the specific node at the given zero-based <code>index</code> into the list. Returns <code>null</code> if the <code>index</code> is out of range.</div>
  </li>
  <li>
    <a href="">namedItem()</a>
    <div>Returns the specific node whose ID or, as a fallback, name matches the string specified by <code>name</code>. Matching by name is only done as a last resort, only in HTML, and only if the referenced element supports the <code>name</code> attribute. Returns <code>null</code> if no node exists by the given name.</div>
  </li>
</ul>

## Events
