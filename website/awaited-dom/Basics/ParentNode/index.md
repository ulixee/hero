# ParentNode

<div class='overview'><span class="seoSummary">The <code><strong>ParentNode</strong></code> mixin contains methods and properties that are common to all types of <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> objects that can have children.</span> It's implemented by <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>, <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a>, and <a href="/en-US/docs/Web/API/DocumentFragment" title="The DocumentFragment interface represents a minimal document object that has no parent. It is used as a lightweight version of Document that stores a segment of a document structure comprised of nodes just like a standard document."><code>DocumentFragment</code></a> objects.</div>

<div class='overview'>See <a href="/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors">Locating DOM elements using selectors</a> to learn how to use <a href="/en-US/docs/Web/CSS/CSS_Selectors">CSS selectors</a> to find nodes or elements of interest.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">childElementCount</a>
    <div>Returns the number of children of this <code>ParentNode</code> which are elements.</div>
  </li>
  <li>
    <a href="">children</a>
    <div>Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> containing all of the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> objects that are children of this <code>ParentNode</code>, omitting all of its non-element nodes.</div>
  </li>
  <li>
    <a href="">firstElementChild</a>
    <div>Returns the first node which is both a child of this <code>ParentNode</code> <em>and</em> is also an <code>Element</code>, or <code>null</code> if there is none.</div>
  </li>
  <li>
    <a href="">lastElementChild</a>
    <div>Returns the last node which is both a child of this <code>ParentNode</code> <em>and</em> is an <code>Element</code>, or <code>null</code> if there is none.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">append()</a>
    <div>Inserts a set of <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> objects or <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> objects after the last child of the <code>ParentNode</code>. <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> objects are inserted as equivalent <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a> nodes.</div>
  </li>
  <li>
    <a href="">prepend()</a>
    <div>Inserts a set of <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> objects or <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> objects before the first child of the <code>ParentNode</code>. <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> objects are inserted as equivalent <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a> nodes.</div>
  </li>
  <li>
    <a href="">querySelector()</a>
    <div>Returns the first <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> with the current element as root that matches the specified group of selectors.</div>
  </li>
  <li>
    <a href="">querySelectorAll()</a>
    <div>Returns a <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> representing a list of elements with the current element as root that matches the specified group of selectors.</div>
  </li>
</ul>

## Events
