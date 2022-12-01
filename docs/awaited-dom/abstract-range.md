# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> AbstractRange

<div class='overview'><span class="seoSummary">The <strong><code>AbstractRange</code></strong>&nbsp;abstract interface is the base class upon which all DOM range types are defined. A&nbsp;<strong>range</strong>&nbsp;is an object that indicates the start and end points of a section of content&nbsp;within the document.</span></div>

<div class='overview'>As an abstract interface, you will not directly instantiate an object of type&nbsp;<code>AbstractRange</code>. Instead, you will use the <code>Range</code> or <code>StaticRange</code> interfaces. To understand the difference between those two interfaces, and how to choose which is appropriate for your needs.</div>

## Properties

### .collapsed <div class="specs"><i>W3C</i></div> {#collapsed}

A Boolean value which is&nbsp;<code>true</code>&nbsp;if the range is&nbsp;<strong>collapsed</strong>. A collapsed range is one whose start position and end position are the same, resulting in a zero-character-long range.

#### **Type**: `Promise<boolean>`

### .endContainer <div class="specs"><i>W3C</i></div> {#endContainer}

The DOM <code>Node</code> in which the end of the range, as specified by the <code>endOffset</code>&nbsp;property,&nbsp;is located.

#### **Type**: [`SuperNode`](./super-node.md)

### .endOffset <div class="specs"><i>W3C</i></div> {#endOffset}

An integer value indicating the offset, in characters, from the beginning of the node's contents to the beginning of the range represented by the range object. This value must be less than the length of the <code>endContainer</code>&nbsp;node.

#### **Type**: `Promise<number>`

### .startContainer <div class="specs"><i>W3C</i></div> {#startContainer}

The DOM <code>Node</code> in which the beginning of the range, as specified by the <code>startOffset</code>&nbsp;property,&nbsp;is located.

#### **Type**: [`SuperNode`](./super-node.md)

### .startOffset <div class="specs"><i>W3C</i></div> {#startOffset}

An integer value indicating the offset, in characters, from the beginning of the node's contents to the last character&nbsp;of the contents referred to&nbsp;&nbsp;by the range object. This value must be less than the length of the node indicated in&nbsp;<code>startContainer</code>.

#### **Type**: `Promise<number>`
