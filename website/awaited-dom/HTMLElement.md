# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLElement

<div class='overview'>The <strong><code>HTMLElement</code></strong> interface represents any <a href="/en-US/docs/Web/HTML" title="/en-US/docs/Web/HTML">HTML</a> element. Some elements directly implement this interface, while others implement it via an interface that inherits it.</div>

## Properties

### .accessKey <div class="specs"><i>W3C</i></div> {#accessKey}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the access key assigned to the element.

#### **Type**: `null`

### .autoCapitalize <div class="specs"><i>W3C</i></div> {#autoCapitalize}

Needs content.

#### **Type**: `null`

### .dir <div class="specs"><i>W3C</i></div> {#dir}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a>, reflecting the <code>dir</code> global attribute, representing the directionality of the element. Possible values are <code>"ltr"</code>, <code>"rtl"</code>, and <code>"auto"
</code>.

#### **Type**: `null`

### .draggable <div class="specs"><i>W3C</i></div> {#draggable}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element can be dragged.

#### **Type**: `null`

### .hidden <div class="specs"><i>W3C</i></div> {#hidden}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating if the element is hidden or not.

#### **Type**: `null`

### .inert <div class="specs"><i>W3C</i></div> {#inert}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> indicating whether the user agent must act as though the given node is absent for the purposes of user interaction events, in-page text searches ("find in page"), and text selection.

#### **Type**: `null`

### .innerText <div class="specs"><i>W3C</i></div> {#innerText}

Represents the "rendered" text content of a node and its descendants. As a getter, it approximates the text the user would get if they highlighted the contents of the element with the cursor and then copied it to the clipboard.

#### **Type**: `null`

### .lang <div class="specs"><i>W3C</i></div> {#lang}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> representing the language of an element's attributes, text, and element contents.

#### **Type**: `null`

### .offsetHeight <div class="specs"><i>W3C</i></div> {#offsetHeight}

Returns a <code>double
</code> containing the height of an element, relative to the layout.

#### **Type**: `null`

### .offsetLeft <div class="specs"><i>W3C</i></div> {#offsetLeft}

Returns a <code>double</code>, the distance from this element's left border to its <code>offsetParent
</code>'s left border.

#### **Type**: `null`

### .offsetParent <div class="specs"><i>W3C</i></div> {#offsetParent}

Returns a <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code>
</a> that is the element from which all offset calculations are currently computed.

#### **Type**: `null`

### .offsetTop <div class="specs"><i>W3C</i></div> {#offsetTop}

Returns a <code>double</code>, the distance from this element's top border to its <code>offsetParent
</code>'s top border.

#### **Type**: `null`

### .offsetWidth <div class="specs"><i>W3C</i></div> {#offsetWidth}

Returns a <code>double
</code> containing the width of an element, relative to the layout.

#### **Type**: `null`

### .spellcheck <div class="specs"><i>W3C</i></div> {#spellcheck}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that controls <a href="/en-US/docs/HTML/Controlling_spell_checking_in_HTML_forms" title="en/Controlling_spell_checking_in_HTML_forms">spell-checking
</a>. It is present on all HTML elements, though it doesn't have an effect on all of them.

#### **Type**: `null`

### .title <div class="specs"><i>W3C</i></div> {#title}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> containing the text that appears in a popup box when mouse is over the element.

#### **Type**: `null`

### .translate <div class="specs"><i>W3C</i></div> {#translate}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> representing the translation.

#### **Type**: `null`

## Methods

### .click*(...args)* <div class="specs"><i>W3C</i></div> {#click}

Sends a mouse click event to the element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
