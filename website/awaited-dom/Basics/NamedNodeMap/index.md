# NamedNodeMap

<div class='overview'>The <code><strong>NamedNodeMap</strong></code> interface represents a collection of <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> objects. Objects inside a <code>NamedNodeMap</code> are not in any particular order, unlike <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a>, although they may be accessed by an index as in an array.</div>

<div class='overview'>A <code>NamedNodeMap</code> object is <em>live</em> and will thus be auto-updated if changes are made to its contents internally or elsewhere.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">length</a>
    <div>Returns the amount of objects in the map.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">getNamedItem()</a>
    <div>Returns a <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a>, corresponding to the given name.</div>
  </li>
  <li>
    <a href="">getNamedItemNS()</a>
    <div>Returns a <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> identified by a namespace and related local name.</div>
  </li>
  <li>
    <a href="">item()</a>
    <div>Returns the <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> at the given index, or <code>null</code> if the index is higher or equal to the number of nodes.</div>
  </li>
  <li>
    <a href="">removeNamedItem()</a>
    <div>Removes the <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> identified by the given map.</div>
  </li>
  <li>
    <a href="">removeNamedItemNS()</a>
    <div>Removes the <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> identified by the given namespace and related local name.</div>
  </li>
  <li>
    <a href="">setNamedItem()</a>
    <div>Replaces, or adds, the <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> identified in the map by the given name.</div>
  </li>
  <li>
    <a href="">setNamedItemNS()</a>
    <div>Replaces, or adds, the <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> identified in the map by the given namespace and related local name.</div>
  </li>
</ul>

## Events
