# SuperDocument

<div class='overview'><span class="seoSummary">The <strong><code>Document</code></strong> interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the <a href="/en-US/docs/Using_the_W3C_DOM_Level_1_Core">DOM tree</a>.</span> The DOM tree includes elements such as <a href="/en-US/docs/Web/HTML/Element/body" title="The HTML <body> Element represents the content of an HTML&nbsp;document. There can be only one <body> element in a document."><code>&lt;body&gt;</code></a> and <a href="/en-US/docs/Web/HTML/Element/table" title="The HTML <table> element represents tabular data — that is, information presented in a two-dimensional table comprised of rows and columns of cells containing data."><code>&lt;table&gt;</code></a>, among <a href="/en-US/docs/Web/HTML/Element">many others</a>. It provides functionality globally to the document, like how to obtain the page's URL and create new elements in the document.</div>

## Properties

### .anchors <div class="specs"><i>W3C</i></div> {#anchors}

Returns a list of all of the anchors in the document.

#### **Type**: `null`

### .body <div class="specs"><i>W3C</i></div> {#body}

Returns the <a href="/en-US/docs/Web/HTML/Element/body" title="The HTML <body> Element represents the content of an HTML&nbsp;document. There can be only one <body> element in a document."><code>&lt;body&gt;</code></a> or <a href="/en-US/docs/Web/HTML/Element/frameset" title="The HTML <frameset> element is used to contain <frame> elements."><code>&lt;frameset&gt;</code></a> node of the current document.

#### **Type**: `null`

### .characterSet <div class="specs"><i>W3C</i></div> {#characterSet}

Returns the character set being used by the document.

#### **Type**: `null`

### .compatMode <div class="specs"><i>W3C</i></div> {#compatMode}

Indicates whether the document is rendered in <em>quirks</em> or <em>strict</em> mode.

#### **Type**: `null`

### .contentType <div class="specs"><i>W3C</i></div> {#contentType}

Returns the Content-Type from the MIME Header of the current document.

#### **Type**: `null`

### .cookie <div class="specs"><i>W3C</i></div> {#cookie}

Returns a semicolon-separated list of the cookies for that document or sets a single cookie.

#### **Type**: `null`

### .defaultView <div class="specs"><i>W3C</i></div> {#defaultView}

Returns a reference to the window object.

#### **Type**: `null`

### .designMode <div class="specs"><i>W3C</i></div> {#designMode}

Gets/sets the ability to edit the whole document.

#### **Type**: `null`

### .dir <div class="specs"><i>W3C</i></div> {#dir}

Gets/sets directionality (rtl/ltr) of the document.

#### **Type**: `null`

### .doctype <div class="specs"><i>W3C</i></div> {#doctype}

Returns the Document Type Definition (DTD) of the current document.

#### **Type**: `null`

### .documentElement <div class="specs"><i>W3C</i></div> {#documentElement}

Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that is a direct child of the document. For HTML documents, this is normally the <a href="/en-US/docs/Web/API/HTMLHtmlElement" title="The HTMLHtmlElement interface serves as the root node for a given HTML document. This object inherits the properties and methods described in the HTMLElement interface."><code>HTMLHtmlElement</code></a> object representing the document's <a href="/en-US/docs/Web/HTML/Element/html" title="The HTML <html> element represents the root (top-level element) of an HTML document, so it is also referred to as the root element. All other elements must be descendants of this element."><code>&lt;html&gt;</code></a> element.

#### **Type**: `null`

### .documentURI <div class="specs"><i>W3C</i></div> {#documentURI}

Returns the document location as a string.

#### **Type**: `null`

### .domain <div class="specs"><i>W3C</i></div> {#domain}

Gets/sets the domain of the current document.

#### **Type**: `null`

### .embeds <div class="specs"><i>W3C</i></div> {#embeds}

Returns a list of the embedded <a href="/en-US/docs/Web/HTML/Element/embed" title="The HTML <embed> element embeds external content at the specified point in the document. This content is provided by an external application or other source of interactive content such as a browser plug-in."><code>&lt;embed&gt;</code></a> elements within the current document.

#### **Type**: `null`

### .featurePolicy <div class="specs"><i>W3C</i></div> {#featurePolicy}

Returns the <a href="/en-US/docs/Web/API/FeaturePolicy" title="The FeaturePolicy&nbsp;interface of the Feature Policy API represents the set of policies applied to the current execution context."><code>FeaturePolicy</code></a> interface which provides a simple API for introspecting the feature policies applied to a specific document.

#### **Type**: `null`

### .fonts <div class="specs"><i>W3C</i></div> {#fonts}

Returns the <a href="/en-US/docs/Web/API/FontFaceSet" title="The FontFaceSet interface of the CSS Font Loading API&nbsp;manages the loading of font-faces&nbsp;and querying of&nbsp;their download&nbsp;status."><code>FontFaceSet</code></a> interface of the current document.

#### **Type**: `null`

### .forms <div class="specs"><i>W3C</i></div> {#forms}

Returns a list of the <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code></a> elements within the current document.

#### **Type**: `null`

### .fullscreenEnabled <div class="specs"><i>W3C</i></div> {#fullscreenEnabled}

Indicates whether or not full-screen mode is available.

#### **Type**: `null`

### .head <div class="specs"><i>W3C</i></div> {#head}

Returns the <a href="/en-US/docs/Web/HTML/Element/head" title="The HTML <head> element contains machine-readable information (metadata) about the document, like its title, scripts, and style sheets."><code>&lt;head&gt;</code></a> element of the current document.

#### **Type**: `null`

### .hidden <div class="specs"><i>W3C</i></div> {#hidden}

Returns a Boolean value indicating if the page is considered hidden or not.

#### **Type**: `null`

### .images <div class="specs"><i>W3C</i></div> {#images}

Returns a list of the images in the current document.

#### **Type**: `null`

### .implementation <div class="specs"><i>W3C</i></div> {#implementation}

Returns the DOM implementation associated with the current document.

#### **Type**: `null`

### .lastModified <div class="specs"><i>W3C</i></div> {#lastModified}

Returns the date on which the document was last modified.

#### **Type**: `null`

### .links <div class="specs"><i>W3C</i></div> {#links}

Returns a list of all the hyperlinks in the document.

#### **Type**: `null`

### .location <div class="specs"><i>W3C</i></div> {#location}

Returns the URI of the current document.

#### **Type**: `null`

### .onfullscreenchange <div class="specs"><i>W3C</i></div> {#onfullscreenchange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/fullscreenchange" title="/en-US/docs/Web/Events/fullscreenchange">fullscreenchange</a></code> event is raised.

#### **Type**: `null`

### .onfullscreenerror <div class="specs"><i>W3C</i></div> {#onfullscreenerror}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/fullscreenerror" title="/en-US/docs/Web/Events/fullscreenerror">fullscreenerror</a></code> event is raised.

#### **Type**: `null`

### .onpointerlockchange <div class="specs"><i>W3C</i></div> {#onpointerlockchange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerlockchange" title="/en-US/docs/Web/Events/pointerlockchange">pointerlockchange</a></code> event is raised.

#### **Type**: `null`

### .onpointerlockerror <div class="specs"><i>W3C</i></div> {#onpointerlockerror}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerlockerror" title="/en-US/docs/Web/Events/pointerlockerror">pointerlockerror</a></code> event is raised.

#### **Type**: `null`

### .onreadystatechange <div class="specs"><i>W3C</i></div> {#onreadystatechange}

Represents the event handling code for the <code><a href="/en-US/docs/Web/Events/readystatechange" title="/en-US/docs/Web/Events/readystatechange">readystatechange</a></code> event.

#### **Type**: `null`

### .onvisibilitychange <div class="specs"><i>W3C</i></div> {#onvisibilitychange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/visibilitychange" title="/en-US/docs/Web/Events/visibilitychange">visibilitychange</a></code> event is raised.

#### **Type**: `null`

### .plugins <div class="specs"><i>W3C</i></div> {#plugins}

Returns a list of the available plugins.

#### **Type**: `null`

### .readyState <div class="specs"><i>W3C</i></div> {#readyState}

Returns loading status of the document.

#### **Type**: `null`

### .referrer <div class="specs"><i>W3C</i></div> {#referrer}

Returns the URI of the page that linked to this page.

#### **Type**: `null`

### .scripts <div class="specs"><i>W3C</i></div> {#scripts}

Returns all the <a href="/en-US/docs/Web/HTML/Element/script" title="The HTML <script> element is used to embed or reference executable code; this is typically used to embed or refer to JavaScript code."><code>&lt;script&gt;</code></a> elements on the document.

#### **Type**: `null`

### .scrollingElement <div class="specs"><i>W3C</i></div> {#scrollingElement}

Returns a reference to the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that scrolls the document.

#### **Type**: `null`

### .title <div class="specs"><i>W3C</i></div> {#title}

Sets or gets the title of the current document.

#### **Type**: `null`

### .URL <div class="specs"><i>W3C</i></div> {#URL}

Returns the document location as a string.

#### **Type**: `null`

### .visibilityState <div class="specs"><i>W3C</i></div> {#visibilityState}

Returns a <code>string</code> denoting the visibility state of the document. Possible values are <code>visible</code>, <code>hidden</code>, <code>prerender</code>, and <code>unloaded</code>.

#### **Type**: `null`

## Methods

### .adoptNode*(...args)* <div class="specs"><i>W3C</i></div> {#adoptNode}

Adopt node from an external document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .captureEvents*(...args)* <div class="specs"><i>W3C</i></div> {#captureEvents}

See <a href="/en-US/docs/Web/API/Window/captureEvents" title="The Window.captureEvents() method registers the window to capture all events of the specified type."><code>Window.captureEvents</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .close*(...args)* <div class="specs"><i>W3C</i></div> {#close}

Closes a document stream for writing.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createAttribute*(...args)* <div class="specs"><i>W3C</i></div> {#createAttribute}

Creates a new <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> object and returns it.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createAttributeNS*(...args)* <div class="specs"><i>W3C</i></div> {#createAttributeNS}

Creates a new attribute node in a given namespace and returns it.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createCDATASection*(...args)* <div class="specs"><i>W3C</i></div> {#createCDATASection}

Creates a new CDATA node and returns it.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createComment*(...args)* <div class="specs"><i>W3C</i></div> {#createComment}

Creates a new comment node and returns it.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createDocumentFragment*(...args)* <div class="specs"><i>W3C</i></div> {#createDocumentFragment}

Creates a new document fragment.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createElement*(...args)* <div class="specs"><i>W3C</i></div> {#createElement}

Creates a new element with the given tag name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createElementNS*(...args)* <div class="specs"><i>W3C</i></div> {#createElementNS}

Creates a new element with the given tag name and namespace URI.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createEvent*(...args)* <div class="specs"><i>W3C</i></div> {#createEvent}

Creates an event object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createNodeIterator*(...args)* <div class="specs"><i>W3C</i></div> {#createNodeIterator}

Creates a <a href="/en-US/docs/Web/API/NodeIterator" title="The NodeIterator interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order."><code>NodeIterator</code></a> object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createProcessingInstruction*(...args)* <div class="specs"><i>W3C</i></div> {#createProcessingInstruction}

Creates a new <a href="/en-US/docs/Web/API/ProcessingInstruction" title="The ProcessingInstruction interface represents a processing instruction; that is, a Node which embeds an instruction targeting a specific application but that can be ignored by any other applications which don't recognize the instruction."><code>ProcessingInstruction</code></a> object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createRange*(...args)* <div class="specs"><i>W3C</i></div> {#createRange}

Creates a <a href="/en-US/docs/Web/API/Range" title="The Range interface represents a fragment of a document that can contain nodes and parts of text nodes."><code>Range</code></a> object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createTextNode*(...args)* <div class="specs"><i>W3C</i></div> {#createTextNode}

Creates a text node.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createTreeWalker*(...args)* <div class="specs"><i>W3C</i></div> {#createTreeWalker}

Creates a <a href="/en-US/docs/Web/API/TreeWalker" title="The TreeWalker object represents the nodes of a document subtree and a position within them."><code>TreeWalker</code></a> object.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .exitFullscreen*(...args)* <div class="specs"><i>W3C</i></div> {#exitFullscreen}

Requests that the element on this document which is currently being presented in full-screen mode be taken out of full-screen mode, restoring the previous state of the screen.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .exitPointerLock*(...args)* <div class="specs"><i>W3C</i></div> {#exitPointerLock}

Release the pointer lock.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getElementsByClassName*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByClassName}

Returns a list of elements with the given class name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getElementsByName*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByName}

Returns a list of elements with the given name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getElementsByTagName*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByTagName}

Returns a list of elements with the given tag name.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getElementsByTagNameNS*(...args)* <div class="specs"><i>W3C</i></div> {#getElementsByTagNameNS}

Returns a list of elements with the given tag name and namespace.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getSelection*(...args)* <div class="specs"><i>W3C</i></div> {#getSelection}

Returns a <a href="/en-US/docs/Web/API/Selection" title="A Selection object represents the range of text selected by the user or the current position of the caret. To obtain a Selection object for examination or manipulation, call window.getSelection()."><code>Selection</code></a> object representing the range of text selected by the user, or the current position of the caret.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .hasFocus*(...args)* <div class="specs"><i>W3C</i></div> {#hasFocus}

Returns <code>true</code> if the focus is currently located anywhere inside the specified document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .importNode*(...args)* <div class="specs"><i>W3C</i></div> {#importNode}

Returns a clone of a node from an external document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .open*(...args)* <div class="specs"><i>W3C</i></div> {#open}

Opens a document stream for writing.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .releaseEvents*(...args)* <div class="specs"><i>W3C</i></div> {#releaseEvents}

See <a href="/en-US/docs/Web/API/Window/releaseEvents" title="Releases the window from trapping events of a specific type."><code>Window.releaseEvents()</code></a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .write*(...args)* <div class="specs"><i>W3C</i></div> {#write}

Writes text in a document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .writeln*(...args)* <div class="specs"><i>W3C</i></div> {#writeln}

Writes a line of text in a document.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

## Events
