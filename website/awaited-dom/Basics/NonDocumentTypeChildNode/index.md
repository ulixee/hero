# NonDocumentTypeChildNode

<div class='overview'>The <code><strong>NonDocumentTypeChildNode</strong></code> interface contains methods that are particular to <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> objects that can have a parent, but not suitable for <a href="/en-US/docs/Web/API/DocumentType" title="The DocumentType interface represents a Node containing a doctype."><code>DocumentType</code></a>.</div>

<div class='overview'><code>NonDocumentTypeChildNode</code> is a raw interface and no object of this type can be created; it is implemented by <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>, and <a href="/en-US/docs/Web/API/CharacterData" title="The CharacterData abstract interface represents a Node object that contains characters. This is an abstract interface, meaning there aren't any object of type CharacterData: it is implemented by other interfaces, like Text, Comment, or ProcessingInstruction which aren't abstract."><code>CharacterData</code></a> objects.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">nextElementSibling</a>
    <div>Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> immediately following this node in its parent's children list, or <code>null</code> if there is no <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> in the list following this node.</div>
  </li>
  <li>
    <a href="">previousElementSibling</a>
    <div>Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> immediately prior to this node in its parent's children list, or <code>null</code> if there is no <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> in the list prior to this node.</div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
