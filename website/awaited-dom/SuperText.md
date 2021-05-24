# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> SuperText

<div class='overview'><span class="seoSummary">The <strong><code>Text</code></strong> interface represents the textual content of <code>Element</code> or <code>Attr</code>. </span></div>

<div class='overview'>If an element has no markup within its content, it has a single child implementing <code>Text</code> that contains the element's text. However, if the element contains markup, it is parsed into information items and <code>Text</code> nodes that form its children.</div>

<div class='overview'>New documents have a single <code>Text</code> node for each block of text. Over time, more <code>Text</code> nodes may be created as the document's content changes. The <code>Node.normalize()</code> method merges adjacent <code>Text</code> objects back into a single node for each block of text.</div>

## Dependencies


SuperText implements all the properties and methods of the following classes:

|     |     |
| --- | --- |
| [CDATASection](./cdata-section) | [CharacterData](./character-data)
[EventTarget](./event-target) | [Node](./node)
[Text](./text) |  |
