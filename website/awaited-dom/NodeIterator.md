# NodeIterator

<div class='overview'><span class="seoSummary">The <strong><code>NodeIterator</code></strong> interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order.</span></div>

## Properties

### .filter <div class="specs"><i>W3C</i></div> {#filter}

Returns a <a href="/en-US/docs/Web/API/NodeFilter" title="A NodeFilter interface represents an object used to filter the nodes in a NodeIterator or TreeWalker. They don't know anything about the DOM or how to traverse nodes; they just know how to evaluate a single node against the provided filter."><code>NodeFilter</code></a> used to select the relevant nodes.

#### **Type**: `null`

### .pointerBeforeReferenceNode <div class="specs"><i>W3C</i></div> {#pointerBeforeReferenceNode}

Returns a <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> flag that indicates whether the <a href="/en-US/docs/Web/API/NodeIterator" title="The NodeIterator interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order."><code>NodeIterator</code></a> is anchored before, the flag being <code>true</code>, or after, the flag being <code>false</code>, the anchor node.

#### **Type**: `null`

### .referenceNode <div class="specs"><i>W3C</i></div> {#referenceNode}

Returns the <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> to which the iterator is anchored.

#### **Type**: `null`

### .root <div class="specs"><i>W3C</i></div> {#root}

Returns a <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> representing the root node as specified when the <code>NodeIterator</code> was created.

#### **Type**: `null`

### .whatToShow <div class="specs"><i>W3C</i></div> {#whatToShow}


	<p>Returns an <code>unsigned long</code> being a bitmask made of constants describing the types of <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> that must to be presented. Non-matching nodes are skipped, but their children may be included, if relevant.</p>
	<p>The possible values are:</p>
	<table class="standard-table">
		<thead>
			<tr>
				<th class="header" scope="col">Constant</th>
				<th class="header" scope="col">Numerical value</th>
				<th class="header" scope="col">Description</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><code>NodeFilter.SHOW_ALL</code></td>
				<td><code>-1</code> (that is the max value of <code>unsigned long</code>)</td>
				<td>Shows all nodes.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_ATTRIBUTE</code> <span class="icon-only-inline" title="This is an obsolete API and is no longer guaranteed to work."><i class="icon-trash"> </i></span></td>
				<td><code>2</code></td>
				<td>Shows attribute <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> nodes. This is meaningful only when creating a <a href="/en-US/docs/Web/API/NodeIterator" title="The NodeIterator interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order."><code>NodeIterator</code></a> with an <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> node as its root; in this case, it means that the attribute node will appear in the first position of the iteration or traversal. Since attributes are never children of other nodes, they do not appear when traversing over the document tree.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_CDATA_SECTION</code> <span class="icon-only-inline" title="This is an obsolete API and is no longer guaranteed to work."><i class="icon-trash"> </i></span></td>
				<td><code>8</code></td>
				<td>Shows <a href="/en-US/docs/Web/API/CDATASection" title="The CDATASection interface represents a CDATA section that can be used within XML to include extended portions of unescaped text. The symbols < and &amp; don’t need escaping as they normally do when inside a CDATA section."><code>CDATASection</code></a>&nbsp;nodes.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_COMMENT</code></td>
				<td><code>128</code></td>
				<td>Shows <a href="/en-US/docs/Web/API/Comment" title="The Comment interface represents textual notations within markup; although it is generally not visually shown, such comments are available to be read in the source view."><code>Comment</code></a>&nbsp;nodes.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_DOCUMENT</code></td>
				<td><code>256</code></td>
				<td>Shows <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a>&nbsp;nodes.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_DOCUMENT_FRAGMENT</code></td>
				<td><code>1024</code></td>
				<td>Shows <a href="/en-US/docs/Web/API/DocumentFragment" title="The DocumentFragment interface represents a minimal document object that has no parent. It is used as a lightweight version of Document that stores a segment of a document structure comprised of nodes just like a standard document."><code>DocumentFragment</code></a>&nbsp;nodes.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_DOCUMENT_TYPE</code></td>
				<td><code>512</code></td>
				<td>Shows <a href="/en-US/docs/Web/API/DocumentType" title="The DocumentType interface represents a Node containing a doctype."><code>DocumentType</code></a>&nbsp;nodes.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_ELEMENT</code></td>
				<td><code>1</code></td>
				<td>Shows <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>&nbsp;nodes.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_ENTITY</code> <span class="icon-only-inline" title="This is an obsolete API and is no longer guaranteed to work."><i class="icon-trash"> </i></span></td>
				<td><code>32</code></td>
				<td>Shows <a class="new" href="/en-US/docs/Web/API/Entity" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>Entity</code></a>&nbsp;nodes. This is meaningful only when creating a <a href="/en-US/docs/Web/API/NodeIterator" title="The NodeIterator interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order."><code>NodeIterator</code></a> with an <a class="new" href="/en-US/docs/Web/API/Entity" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>Entity</code></a> node as its root; in this case, it means that the <a class="new" href="/en-US/docs/Web/API/Entity" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>Entity</code></a> node will appear in the first position of the traversal. Since entities are not part of the document tree, they do not appear when traversing over the document tree.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_ENTITY_REFERENCE</code> <span class="icon-only-inline" title="This is an obsolete API and is no longer guaranteed to work."><i class="icon-trash"> </i></span></td>
				<td><code>16</code></td>
				<td>Shows <a class="new" href="/en-US/docs/Web/API/EntityReference" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>EntityReference</code></a>&nbsp;nodes.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_NOTATION</code> <span class="icon-only-inline" title="This is an obsolete API and is no longer guaranteed to work."><i class="icon-trash"> </i></span></td>
				<td><code>2048</code></td>
				<td>Shows <a href="/en-US/docs/Web/API/Notation" title="Represents a DTD notation (read-only). May declare format of an unparsed entity or formally declare the document's processing instruction targets. Inherits methods and properties from Node. Its nodeName is the notation name. Has no parent."><code>Notation</code></a> nodes. This is meaningful only when creating a <a href="/en-US/docs/Web/API/NodeIterator" title="The NodeIterator interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order."><code>NodeIterator</code></a> with a <a href="/en-US/docs/Web/API/Notation" title="Represents a DTD notation (read-only). May declare format of an unparsed entity or formally declare the document's processing instruction targets. Inherits methods and properties from Node. Its nodeName is the notation name. Has no parent."><code>Notation</code></a> node as its root; in this case, it means that the <a href="/en-US/docs/Web/API/Notation" title="Represents a DTD notation (read-only). May declare format of an unparsed entity or formally declare the document's processing instruction targets. Inherits methods and properties from Node. Its nodeName is the notation name. Has no parent."><code>Notation</code></a> node will appear in the first position of the traversal. Since entities are not part of the document tree, they do not appear when traversing over the document tree.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_PROCESSING_INSTRUCTION</code></td>
				<td><code>64</code></td>
				<td>Shows <a href="/en-US/docs/Web/API/ProcessingInstruction" title="The ProcessingInstruction interface represents a processing instruction; that is, a Node which embeds an instruction targeting a specific application but that can be ignored by any other applications which don't recognize the instruction."><code>ProcessingInstruction</code></a>&nbsp;nodes.</td>
			</tr>
			<tr>
				<td><code>NodeFilter.SHOW_TEXT</code></td>
				<td><code>4</code></td>
				<td>Shows <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a>&nbsp;nodes.</td>
			</tr>
		</tbody>
	</table>
	

#### **Type**: `null`

## Methods

### .detach*(...args)* <div class="specs"><i>W3C</i></div> {#detach}

This operation is a no-op. It doesn't do anything. Previously it was telling the engine that the <code>NodeIterator</code> was no more used, but this is now useless.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .nextNode*(...args)* <div class="specs"><i>W3C</i></div> {#nextNode}

Returns the next <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> in the document, or <code>null</code> if there are none.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .previousNode*(...args)* <div class="specs"><i>W3C</i></div> {#previousNode}

Returns the previous <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> in the document, or <code>null</code> if there are none.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

## Events
