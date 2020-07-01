# DocumentOrShadowRoot

<div class='overview'><span class="seoSummary">The <strong><code>DocumentOrShadowRoot</code></strong> mixin of the&nbsp;<a href="/en-US/docs/Web/Web_Components/Using_shadow_DOM">Shadow DOM API</a> provides APIs that are shared between documents and shadow roots. The following features are included in both <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a> and <a href="/en-US/docs/Web/API/ShadowRoot" title="The ShadowRoot interface of the Shadow DOM API is the root node of a DOM subtree that is rendered separately from a document's main DOM tree."><code>ShadowRoot</code></a>. </span></div>

## Properties

### .activeElement <div class="specs"><i>W3C</i></div> {#activeElement}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> within the shadow tree that has focus.

#### **Type**: `SuperDocument`

### .fullscreenElement <div class="specs"><i>W3C</i></div> {#fullscreenElement}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that's currently in full screen mode for this document.

#### **Type**: `SuperDocument`

### .pointerLockElement <div class="specs"><i>W3C</i></div> {#pointerLockElement}

Returns the element set as the target for mouse events while the pointer is locked. It returns&nbsp;<code>null</code> if lock is pending, the pointer is unlocked, or if the target is in another document.

#### **Type**: `SuperDocument`

## Methods

### .caretPositionFromPoint*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#caretPositionFromPoint}

Returns a <a href="/en-US/docs/Web/API/CaretPosition" title="The CaretPosition interface represents the caret position, an indicator for the text insertion point. You can get a CaretPosition using the document.caretPositionFromPoint method."><code>CaretPosition</code></a> object containing the DOM node containing the caret, and caret's character offset within that node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .elementFromPoint*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#elementFromPoint}

Returns the topmost element at the specified coordinates.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .elementsFromPoint*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#elementsFromPoint}

Returns an array of all elements at the specified coordinates.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getSelection*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getSelection}

Returns a <a href="/en-US/docs/Web/API/Selection" title="A Selection object represents the range of text selected by the user or the current position of the caret. To obtain a Selection object for examination or manipulation, call window.getSelection()."><code>Selection</code></a> object representing the range of text selected by the user, or the current position of the caret.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
