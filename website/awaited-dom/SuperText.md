# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> SuperText

<div class='overview'><span class="seoSummary">The <strong><code>Text</code></strong> interface represents the textual content of <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> or <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a>. </span></div>

<div class='overview'>If an element has no markup within its content, it has a single child implementing <code>Text</code> that contains the element's text. However, if the element contains markup, it is parsed into information items and <code>Text</code> nodes that form its children.</div>

<div class='overview'>New documents have a single <code>Text</code> node for each block of text. Over time, more <code>Text</code> nodes may be created as the document's content changes. The <a href="/en-US/docs/Web/API/Node/normalize" title="The Node.normalize() method puts the specified node and all of its sub-tree into a &quot;normalized&quot; form. In a normalized sub-tree, no text nodes in the sub-tree are empty and there are no adjacent text nodes."><code>Node.normalize()</code></a> method merges adjacent <code>Text</code> objects back into a single node for each block of text.</div>

## Dependencies


SuperText implements all the properties and methods of the following classes:

 |   |   | 
 | --- | --- | 
 | [CDATASection](./cdata-section) | [CharacterData](./character-data)
[ChildNode](./child-node) | [EventTarget](./event-target)
[Node](./node) | [NonDocumentTypeChildNode](./non-document-type-child-node)
[Slotable](./slotable) | [Text](./text) | 
