# AbstractRange

<div class='overview'><span class="seoSummary">The <strong><code>AbstractRange</code></strong>&nbsp;abstract interface is the base class upon which all <a class="glossaryLink" href="/en-US/docs/Glossary/DOM" title="DOM: The DOM (Document Object Model) is an API that represents and interacts with any HTML or XML document. The DOM is a document model loaded in the browser and representing the document as a node tree, where each node represents part of the document (e.g. an element, text string, or comment).">DOM</a> range types are defined. A&nbsp;<strong>range</strong>&nbsp;is an object that indicates the start and end points of a section of content&nbsp;within the document.</span></div>

<div class='overview'>As an abstract interface, you will not directly instantiate an object of type&nbsp;<code>AbstractRange</code>. Instead, you will use the <a href="/en-US/docs/Web/API/Range" title="The Range interface represents a fragment of a document that can contain nodes and parts of text nodes."><code>Range</code></a> or <a href="/en-US/docs/Web/API/StaticRange" title="The DOM&nbsp;StaticRange interface extends AbstractRange to provide a method to specify a range of content in the DOM whose contents don't update to reflect changes which occur within the DOM tree."><code>StaticRange</code></a> interfaces. To understand the difference between those two interfaces, and how to choose which is appropriate for your needs.</div>

## Properties

### .collapsed <div class="specs"><i>W3C</i></div> {#collapsed}

A Boolean value which is&nbsp;<code>true</code>&nbsp;if the range is&nbsp;<strong>collapsed</strong>. A collapsed range is one whose start position and end position are the same, resulting in a zero-character-long range.

#### **Type**: `SuperDocument`

### .endContainer <div class="specs"><i>W3C</i></div> {#endContainer}

The DOM <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> in which the end of the range, as specified by the <code>endOffset</code>&nbsp;property,&nbsp;is located.

#### **Type**: `SuperDocument`

### .endOffset <div class="specs"><i>W3C</i></div> {#endOffset}

An integer value indicating the offset, in characters, from the beginning of the node's contents to the beginning of the range represented by the range object. This value must be less than the length of the <code>endContainer</code>&nbsp;node.

#### **Type**: `SuperDocument`

### .startContainer <div class="specs"><i>W3C</i></div> {#startContainer}

The DOM <a href="/en-US/docs/Web/API/Node" title="Node is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way."><code>Node</code></a> in which the beginning of the range, as specified by the <code>startOffset</code>&nbsp;property,&nbsp;is located.

#### **Type**: `SuperDocument`

### .startOffset <div class="specs"><i>W3C</i></div> {#startOffset}

An integer value indicating the offset, in characters, from the beginning of the node's contents to the last character&nbsp;of the contents referred to&nbsp;&nbsp;by the range object. This value must be less than the length of the node indicated in&nbsp;<code>startContainer</code>.

#### **Type**: `SuperDocument`

## Methods

## Events
