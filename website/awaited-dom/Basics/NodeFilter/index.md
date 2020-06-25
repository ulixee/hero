# NodeFilter

<div class='overview'>A <strong><code>NodeFilter</code></strong> interface represents an object used to filter the nodes in a <a href="/en-US/docs/Web/API/NodeIterator" title="The NodeIterator interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order."><code>NodeIterator</code></a> or <a href="/en-US/docs/Web/API/TreeWalker" title="The TreeWalker object represents the nodes of a document subtree and a position within them."><code>TreeWalker</code></a>. They don't know anything about the DOM or how to traverse nodes; they just know how to evaluate a single node against the provided filter.</div>

## Properties

<ul class="items properties">

</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">acceptNode()</a>
    <div>Returns an <code>unsigned short</code> that will be used to tell if a given <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> must be accepted or not by the <a href="/en-US/docs/Web/API/NodeIterator" title="The NodeIterator interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order."><code>NodeIterator</code></a> or <a href="/en-US/docs/Web/API/TreeWalker" title="The TreeWalker object represents the nodes of a document subtree and a position within them."><code>TreeWalker</code></a> iteration algorithm. This method is expected to be written by the user of a <code>NodeFilter</code>. Possible return values are:
	<table class="standard-table">
		<tbody>
			<tr>
				<td class="header">Constant</td>
				<td class="header">Description</td>
			</tr>
			<tr>
				<td><code>FILTER_ACCEPT</code></td>
				<td>Value returned by the <a href="/en-US/docs/Web/API/NodeFilter/acceptNode" title="The NodeFilter.acceptNode() method returns an unsigned short that will be used to tell if a given Node must be accepted or not by the NodeIterator or TreeWalker iteration algorithm. This method is expected to be written by the user of a NodeFilter. Possible return values are:"><code>NodeFilter.acceptNode()</code></a> method when a node should be accepted.</td>
			</tr>
			<tr>
				<td><code>FILTER_REJECT</code></td>
				<td>Value to be returned by the <a href="/en-US/docs/Web/API/NodeFilter/acceptNode" title="The NodeFilter.acceptNode() method returns an unsigned short that will be used to tell if a given Node must be accepted or not by the NodeIterator or TreeWalker iteration algorithm. This method is expected to be written by the user of a NodeFilter. Possible return values are:"><code>NodeFilter.acceptNode()</code></a> method when a node should be rejected. For&nbsp;<a href="/en-US/docs/Web/API/TreeWalker" title="The TreeWalker object represents the nodes of a document subtree and a position within them."><code>TreeWalker</code></a>, child nodes are also rejected. For&nbsp;<a href="/en-US/docs/Web/API/NodeIterator" title="The NodeIterator interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order."><code>NodeIterator</code></a>, this flag is synonymous with FILTER_SKIP.</td>
			</tr>
			<tr>
				<td><code>FILTER_SKIP</code></td>
				<td>Value to be returned by <a href="/en-US/docs/Web/API/NodeFilter/acceptNode" title="The NodeFilter.acceptNode() method returns an unsigned short that will be used to tell if a given Node must be accepted or not by the NodeIterator or TreeWalker iteration algorithm. This method is expected to be written by the user of a NodeFilter. Possible return values are:"><code>NodeFilter.acceptNode()</code></a> for nodes to be skipped by the <a href="/en-US/docs/Web/API/NodeIterator" title="The NodeIterator interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order."><code>NodeIterator</code></a> or <a href="/en-US/docs/Web/API/TreeWalker" title="The TreeWalker object represents the nodes of a document subtree and a position within them."><code>TreeWalker</code></a> object. The children of skipped nodes are still considered. This is treated as "skip this node but not its children".</td>
			</tr>
		</tbody>
	</table>
	</div>
  </li>
</ul>

## Events
