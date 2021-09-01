# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLFormControlsCollection

<div class='overview'><span class="seoSummary">The <strong><code>HTMLFormControlsCollection</code></strong> interface represents a <em>collection</em> of HTML <em>form control elements</em>. </span>It represents the lists returned by the <code>HTMLFormElement</code> interface's <code>elements</code> property and the <code>HTMLFieldSetElement</code> interface's&nbsp;<code>elements</code> property.</div>

<div class='overview'>This interface replaces one method from <code>HTMLCollection</code>, on which it is based.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Needs content.

#### **Type**: `Promise<number>`

## Methods

### .namedItem*(name)* <div class="specs"><i>W3C</i></div> {#namedItem}

Returns the <code>RadioNodeList</code> or the <code>Element</code> in the collection whose <code>name</code> or <code>id</code> matches&nbsp;the specified name, or <code>null</code> if no nodes match. Note that this version of <code>namedItem()</code> hide the one inherited from <code>HTMLCollection</code>. Like that one, in JavaScript, using the array bracket syntax with a <code>String</code>, like <code><em>collection</em>["value"]</code> is equivalent to <code><em>collection</em>.namedItem("value")</code>.

#### **Arguments**:


 - name `string`. <code>str</code> is a `string`

#### **Returns**: `Promise<RadioNodeList,SuperElement>`

### .item*(index)* <div class="specs"><i>W3C</i></div> {#item}

Needs content.

#### **Arguments**:


 - index `number`. Needs content.

#### **Returns**: [`SuperElement`](/docs/awaited-dom/super-element)
