# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLFormControlsCollection

<div class='overview'><span class="seoSummary">The <strong><code>HTMLFormControlsCollection</code></strong> interface represents a <em>collection</em> of HTML <em>form control elements</em>. </span>It represents the lists returned by the <a href="/en-US/docs/Web/API/HTMLFormElement" title="The HTMLFormElement interface represents a <form> element in the DOM; it allows access to and in some cases modification of aspects of the form, as well as access to its component elements."><code>HTMLFormElement</code></a> interface's <a href="/en-US/docs/Web/API/HTMLFormElement/elements" title="The HTMLFormElement property elements returns an HTMLFormControlsCollection listing all the form controls contained in the <form> element."><code>elements</code></a> property and the <a href="/en-US/docs/Web/API/HTMLFieldSetElement" title="The HTMLFieldSetElement interface provides special properties and methods (beyond the regular HTMLElement interface it also has available to it by inheritance) for manipulating the layout and presentation of <fieldset> elements."><code>HTMLFieldSetElement</code></a> interface's&nbsp;<a class="new" href="/en-US/docs/Web/API/HTMLFieldSetElement/elements" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>elements</code></a> property.</div>

<div class='overview'>This interface replaces one method from <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a>, on which it is based.</div>

## Methods

### .namedItem*(...args)* <div class="specs"><i>W3C</i></div> {#namedItem}

Returns the <a href="/en-US/docs/Web/API/RadioNodeList" title="The RadioNodeList interface represents a collection of radio elements in a <form> or a <fieldset> element."><code>RadioNodeList</code></a> or the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> in the collection whose <code>name</code> or <code>id</code> matches&nbsp;the specified name, or <code>null</code> if no nodes match. Note that this version of <code>namedItem()</code> hide the one inherited from <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a>. Like that one, in JavaScript, using the array bracket syntax with a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/String" title="The String global object is a constructor for strings or a sequence of characters."><code>String</code></a>, like <code><em>collection</em>["value"]</code> is equivalent to <code><em>collection</em>.namedItem("value")
</code>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
