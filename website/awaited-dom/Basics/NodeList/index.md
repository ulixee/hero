# NodeList

<div class='overview'><span class="seoSummary"><strong><code>NodeList</code></strong> objects are collections of <a href="/en-US/docs/Glossary/Node/DOM">nodes</a>, usually returned by properties such as <a href="/en-US/docs/Web/API/Node/childNodes" title="The Node.childNodes read-only property returns a live NodeList of child nodes of the given element where the first child node is assigned index 0."><code>Node.childNodes</code></a> and methods such as <a href="/en-US/docs/Web/API/Document/querySelectorAll" title="The Document method querySelectorAll() returns a static (not live) NodeList representing a list of the document's elements that match the specified group of selectors."><code>document.querySelectorAll()</code></a>.</span></div>

## Properties

<ul class="items properties">
  <li>
    <a href="">length</a>
    <div>The number of nodes in the <code>NodeList</code>.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">entries()</a>
    <div>Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols" title="A couple of additions to ECMAScript 2015 aren't new built-ins or syntax, but protocols. These protocols can be implemented by any object respecting some conventions."><code>iterator</code></a>, allowing code to go through all key/value pairs contained in the collection. (In this case, the keys are numbers starting from <code>0</code> and the values are nodes.)</div>
  </li>
  <li>
    <a href="">forEach()</a>
    <div>Executes a provided function once per <code>NodeList</code> element, passing the element as an argument to the function.</div>
  </li>
  <li>
    <a href="">item()</a>
    <div>Returns an item in the list by its index, or <code>null</code> if the index is out-of-bounds.</div>
  </li>
  <li>
    <a href="">keys()</a>
    <div>Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols" title="A couple of additions to ECMAScript 2015 aren't new built-ins or syntax, but protocols. These protocols can be implemented by any object respecting some conventions."><code>iterator</code></a>, allowing code to go through all the keys of the key/value pairs contained in the collection. (In this case, the keys are numbers starting from <code>0</code>.)</div>
  </li>
  <li>
    <a href="">values()</a>
    <div>Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols" title="A couple of additions to ECMAScript 2015 aren't new built-ins or syntax, but protocols. These protocols can be implemented by any object respecting some conventions."><code>iterator</code></a> allowing code to go through all values (nodes) of the key/value pairs contained in the collection.</div>
  </li>
</ul>

## Events
