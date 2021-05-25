# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> NonDocumentTypeChildNode

<div class='overview'>The <code><strong>NonDocumentTypeChildNode</strong></code> interface contains methods that are particular to <code>Node</code> objects that can have a parent, but not suitable for <code>DocumentType</code>.</div>

<div class='overview'><code>NonDocumentTypeChildNode</code> is a raw interface and no object of this type can be created; it is implemented by <code>Element</code>, and <code>CharacterData</code> objects.</div>

## Properties

### .nextElementSibling <div class="specs"><i>W3C</i></div> {#nextElementSibling}

Returns the <code>Element</code> immediately following this node in its parent's children list, or <code>null</code> if there is no <code>Element</code> in the list following this node.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### .previousElementSibling <div class="specs"><i>W3C</i></div> {#previousElementSibling}

Returns the <code>Element</code> immediately prior to this node in its parent's children list, or <code>null</code> if there is no <code>Element</code> in the list prior to this node.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)
