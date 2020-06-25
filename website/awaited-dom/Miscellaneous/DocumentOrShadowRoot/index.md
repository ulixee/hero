# DocumentOrShadowRoot

<div class='overview'><span class="seoSummary">The <strong><code>DocumentOrShadowRoot</code></strong> mixin of the&nbsp;<a href="/en-US/docs/Web/Web_Components/Using_shadow_DOM">Shadow DOM API</a> provides APIs that are shared between documents and shadow roots. The following features are included in both <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> and <a href="/en-US/docs/Web/API/ShadowRoot" title="The ShadowRoot interface of the Shadow DOM API is the root node of a DOM subtree that is rendered separately from a document's main DOM tree."><code>ShadowRoot</code></a>. </span></div>

## Properties

<ul class="items properties">
  <li>
    <a href="">activeElement</a>
    <div>Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> within the shadow tree that has focus.</div>
  </li>
  <li>
    <a href="">fullscreenElement</a>
    <div>Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that's currently in full screen mode for this document.</div>
  </li>
  <li>
    <a href="">pointerLockElement</a>
    <div>Returns the element set as the target for mouse events while the pointer is locked. It returns&nbsp;<code>null</code> if lock is pending, the pointer is unlocked, or if the target is in another document.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">caretPositionFromPoint()</a>
    <div>Returns a <a href="/en-US/docs/Web/API/CaretPosition" title="The CaretPosition interface represents the caret position, an indicator for the text insertion point. You can get a CaretPosition using the document.caretPositionFromPoint method."><code>CaretPosition</code></a> object containing the DOM node containing the caret, and caret's character offset within that node.</div>
  </li>
  <li>
    <a href="">elementFromPoint()</a>
    <div>Returns the topmost element at the specified coordinates.</div>
  </li>
  <li>
    <a href="">elementsFromPoint()</a>
    <div>Returns an array of all elements at the specified coordinates.</div>
  </li>
  <li>
    <a href="">getSelection()</a>
    <div>Returns a <a href="/en-US/docs/Web/API/Selection" title="A Selection object represents the range of text selected by the user or the current position of the caret. To obtain a Selection object for examination or manipulation, call window.getSelection()."><code>Selection</code></a> object representing the range of text selected by the user, or the current position of the caret.</div>
  </li>
</ul>

## Events
