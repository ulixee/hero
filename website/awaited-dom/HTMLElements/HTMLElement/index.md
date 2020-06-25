# HTMLElement

<div class='overview'>The <strong><code>HTMLElement</code></strong> interface represents any <a href="/en-US/docs/Web/HTML" title="/en-US/docs/Web/HTML">HTML</a> element. Some elements directly implement this interface, while others implement it via an interface that inherits it.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">accessKey</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the access key assigned to the element.</div>
  </li>
  <li>
    <a href="">autoCapitalize</a>
    <div></div>
  </li>
  <li>
    <a href="">dir</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a>, reflecting the <code>dir</code> global attribute, representing the directionality of the element. Possible values are <code>"ltr"</code>, <code>"rtl"</code>, and <code>"auto"</code>.</div>
  </li>
  <li>
    <a href="">draggable</a>
    <div>Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> indicating if the element can be dragged.</div>
  </li>
  <li>
    <a href="">hidden</a>
    <div>Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> indicating if the element is hidden or not.</div>
  </li>
  <li>
    <a href="">inert</a>
    <div>Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> indicating whether the user agent must act as though the given node is absent for the purposes of user interaction events, in-page text searches ("find in page"), and text selection.</div>
  </li>
  <li>
    <a href="">innerText</a>
    <div>Represents the "rendered" text content of a node and its descendants. As a getter, it approximates the text the user would get if they highlighted the contents of the element with the cursor and then copied it to the clipboard.</div>
  </li>
  <li>
    <a href="">lang</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing the language of an element's attributes, text, and element contents.</div>
  </li>
  <li>
    <a href="">offsetHeight</a>
    <div>Returns a <code>double</code> containing the height of an element, relative to the layout.</div>
  </li>
  <li>
    <a href="">offsetLeft</a>
    <div>Returns a <code>double</code>, the distance from this element's left border to its <code>offsetParent</code>'s left border.</div>
  </li>
  <li>
    <a href="">offsetParent</a>
    <div>Returns a <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that is the element from which all offset calculations are currently computed.</div>
  </li>
  <li>
    <a href="">offsetTop</a>
    <div>Returns a <code>double</code>, the distance from this element's top border to its <code>offsetParent</code>'s top border.</div>
  </li>
  <li>
    <a href="">offsetWidth</a>
    <div>Returns a <code>double</code> containing the width of an element, relative to the layout.</div>
  </li>
  <li>
    <a href="">spellcheck</a>
    <div>Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that controls <a href="/en-US/docs/HTML/Controlling_spell_checking_in_HTML_forms" title="en/Controlling_spell_checking_in_HTML_forms">spell-checking</a>. It is present on all HTML elements, though it doesn't have an effect on all of them.</div>
  </li>
  <li>
    <a href="">title</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the text that appears in a popup box when mouse is over the element.</div>
  </li>
  <li>
    <a href="">translate</a>
    <div>Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> representing the translation.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">click()</a>
    <div>Sends a mouse click event to the element.</div>
  </li>
</ul>

## Events
