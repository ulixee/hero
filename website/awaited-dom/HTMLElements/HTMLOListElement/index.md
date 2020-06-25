# HTMLOListElement

<div class='overview'>The <strong><code>HTMLOListElement</code></strong> interface provides special properties (beyond those defined on the regular <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface it also has available to it by inheritance) for manipulating ordered list elements.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">compact</a>
    <div>Is a <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> indicating that spacing between list items should be reduced. This property reflects the <code><a href="/en-US/docs/Web/HTML/Element/ol#attr-compact">compact</a></code> attribute only, it doesn't consider the <a href="/en-US/docs/Web/CSS/line-height" title="The line-height CSS property sets the height of a line box. It's commonly used to set the distance between lines of text."><code>line-height</code></a> CSS property used for that behavior in modern pages.</div>
  </li>
  <li>
    <a href="">reversed</a>
    <div>Is a <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> value reflecting the <code><a href="/en-US/docs/Web/HTML/Element/ol#attr-reversed">reversed</a></code> and defining if the numbering is descending, that is its value is <code>true</code>, or ascending (<code>false</code>).</div>
  </li>
  <li>
    <a href="">start</a>
    <div>Is a <code>long</code> value reflecting the <code><a href="/en-US/docs/Web/HTML/Element/ol#attr-start">start</a></code> and defining the value of the first number of the first element of the list.</div>
  </li>
  <li>
    <a href="">type</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> value reflecting the <code><a href="/en-US/docs/Web/HTML/Element/ol#attr-type">type</a></code> and defining the kind of marker to be used to display. It can have the following values:
 <ul>
  <li><code>'1'</code> meaning that decimal numbers are used: <code>1</code>, <code>2</code>, <code>3</code>, <code>4</code>, <code>5</code>, …</li>
  <li><code>'a'</code> meaning that the lowercase latin alphabet is used:&nbsp; <code>a</code>, <code>b</code>, <code>c</code>, <code>d</code>, <code>e</code>, …</li>
  <li><code>'A'</code> meaning that the uppercase latin alphabet is used: <code>A</code>, <code>B</code>, <code>C</code>, <code>D</code>, <code>E</code>, …</li>
  <li><code>'i'</code> meaning that the lowercase latin numerals are used: <code>i</code>, <code>ii</code>, <code>iii</code>, <code>iv</code>, <code>v</code>, …</li>
  <li><code>'I'</code> meaning that the uppercase latin numerals are used: <code>I</code>, <code>II</code>, <code>III</code>, <code>IV</code>, <code>V</code>, …</li>
 </ul>
 </div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
