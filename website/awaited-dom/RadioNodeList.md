# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> RadioNodeList

<div class='overview'>The <strong><code>RadioNodeList</code></strong> interface represents a collection of radio elements in a <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code></a> or a <a href="/en-US/docs/Web/HTML/Element/fieldset" title="The HTML <fieldset> element is used to group several controls as well as labels (<label>) within a web form."><code>&lt;fieldset&gt;</code></a> element.</div>

## Properties

### .value <div class="specs"><i>W3C</i></div> {#value}

If the underlying element collection contains radio buttons, the <code>value</code> property represents the checked radio button. On retrieving the <code>value</code> property, the <code>value</code> of the currently <code>checked</code> radio button is returned as a string. If the collection does not contain any radio buttons or none of the radio buttons in the collection is in <code>checked</code> state, the empty string is returned. On setting the <code>value</code> property, the first radio button input element whose <code>value</code> property is equal to the new value will be set to <code>checked
</code>.

#### **Type**: `string`

### .length <div class="specs"><i>W3C</i></div> {#length}

The number of nodes in the <code>NodeList
</code>.

#### **Type**: `number`

## Methods

### .entries*(...args)* <div class="specs"><i>W3C</i></div> {#entries}

Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols" title="A couple of additions to ECMAScript 2015 aren't new built-ins or syntax, but protocols. These protocols can be implemented by any object respecting some conventions."><code>iterator</code></a>, allowing code to go through all key/value pairs contained in the collection. (In this case, the keys are numbers starting from <code>0
</code> and the values are nodes.)

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### .forEach*(...args)* <div class="specs"><i>W3C</i></div> {#forEach}

Executes a provided function once per <code>NodeList
</code> element, passing the element as an argument to the function.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### .item*(...args)* <div class="specs"><i>W3C</i></div> {#item}

Returns an item in the list by its index, or <code>null
</code> if the index is out-of-bounds.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### .keys*(...args)* <div class="specs"><i>W3C</i></div> {#keys}

Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols" title="A couple of additions to ECMAScript 2015 aren't new built-ins or syntax, but protocols. These protocols can be implemented by any object respecting some conventions."><code>iterator</code></a>, allowing code to go through all the keys of the key/value pairs contained in the collection. (In this case, the keys are numbers starting from <code>0
</code>.)

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true

### .values*(...args)* <div class="specs"><i>W3C</i></div> {#values}

Returns an <a href="/en-US/docs/Web/JavaScript/Reference/Iteration_protocols" title="A couple of additions to ECMAScript 2015 aren't new built-ins or syntax, but protocols. These protocols can be implemented by any object respecting some conventions."><code>iterator</code>
</a> allowing code to go through all values (nodes) of the key/value pairs contained in the collection.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>` true
