# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> CharacterData

<div class='overview'>The <code><strong>CharacterData</strong></code> abstract interface represents a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> object that contains characters. This is an abstract interface, meaning there aren't any object of type <code>CharacterData</code>: it is implemented by other interfaces, like <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a>, <a href="/en-US/docs/Web/API/Comment" title="The Comment interface represents textual notations within markup; although it is generally not visually shown, such comments are available to be read in the source view."><code>Comment</code></a>, or <a href="/en-US/docs/Web/API/ProcessingInstruction" title="The ProcessingInstruction interface represents a processing instruction; that is, a Node which embeds an instruction targeting a specific application but that can be ignored by any other applications which don't recognize the instruction."><code>ProcessingInstruction</code></a> which aren't abstract.</div>

## Properties

### .data <div class="specs"><i>W3C</i></div> {#data}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the textual data contained in this object.

#### **Type**: `null`

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns an <code>unsigned long</code> representing the size of the string contained in <code>CharacterData.data
</code>.

#### **Type**: `null`

## Methods

### .appendData*(...args)* <div class="specs"><i>W3C</i></div> {#appendData}

Appends the given <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> to the <code>CharacterData.data</code> string; when this method returns, <code>data</code> contains the concatenated <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .deleteData*(...args)* <div class="specs"><i>W3C</i></div> {#deleteData}

Removes the specified amount of characters, starting at the specified offset, from the <code>CharacterData.data</code> string; when this method returns, <code>data</code> contains the shortened <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .insertData*(...args)* <div class="specs"><i>W3C</i></div> {#insertData}

Inserts the specified characters, at the specified offset, in the <code>CharacterData.data</code> string; when this method returns, <code>data</code> contains the modified <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .replaceData*(...args)* <div class="specs"><i>W3C</i></div> {#replaceData}

Replaces the specified amount of characters, starting at the specified offset, with the specified <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a>; when this method returns, <code>data</code> contains the modified <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .substringData*(...args)* <div class="specs"><i>W3C</i></div> {#substringData}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the part of <code>CharacterData.data
</code> of the specified length and starting at the specified offset.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
