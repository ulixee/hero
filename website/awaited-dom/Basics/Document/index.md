# Document

<div class='overview'><span class="seoSummary">The <strong><code>Document</code></strong> interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the <a href="/en-US/docs/Using_the_W3C_DOM_Level_1_Core">DOM tree</a>.</span> The DOM tree includes elements such as <a href="/en-US/docs/Web/HTML/Element/body" title="The HTML <body> Element represents the content of an HTML&nbsp;document. There can be only one <body> element in a document."><code>&lt;body&gt;</code></a> and <a href="/en-US/docs/Web/HTML/Element/table" title="The HTML <table> element represents tabular data — that is, information presented in a two-dimensional table comprised of rows and columns of cells containing data."><code>&lt;table&gt;</code></a>, among <a href="/en-US/docs/Web/HTML/Element">many others</a>. It provides functionality globally to the document, like how to obtain the page's URL and create new elements in the document.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">anchors</a>
    <div>Returns a list of all of the anchors in the document.</div>
  </li>
  <li>
    <a href="">body</a>
    <div>Returns the <a href="/en-US/docs/Web/HTML/Element/body" title="The HTML <body> Element represents the content of an HTML&nbsp;document. There can be only one <body> element in a document."><code>&lt;body&gt;</code></a> or <a href="/en-US/docs/Web/HTML/Element/frameset" title="The HTML <frameset> element is used to contain <frame> elements."><code>&lt;frameset&gt;</code></a> node of the current document.</div>
  </li>
  <li>
    <a href="">characterSet</a>
    <div>Returns the character set being used by the document.</div>
  </li>
  <li>
    <a href="">compatMode</a>
    <div>Indicates whether the document is rendered in <em>quirks</em> or <em>strict</em> mode.</div>
  </li>
  <li>
    <a href="">contentType</a>
    <div>Returns the Content-Type from the MIME Header of the current document.</div>
  </li>
  <li>
    <a href="">cookie</a>
    <div>Returns a semicolon-separated list of the cookies for that document or sets a single cookie.</div>
  </li>
  <li>
    <a href="">defaultView</a>
    <div>Returns a reference to the window object.</div>
  </li>
  <li>
    <a href="">designMode</a>
    <div>Gets/sets the ability to edit the whole document.</div>
  </li>
  <li>
    <a href="">dir</a>
    <div>Gets/sets directionality (rtl/ltr) of the document.</div>
  </li>
  <li>
    <a href="">doctype</a>
    <div>Returns the Document Type Definition (DTD) of the current document.</div>
  </li>
  <li>
    <a href="">documentElement</a>
    <div>Returns the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that is a direct child of the document. For HTML documents, this is normally the <a href="/en-US/docs/Web/API/HTMLHtmlElement" title="The HTMLHtmlElement interface serves as the root node for a given HTML document. This object inherits the properties and methods described in the HTMLElement interface."><code>HTMLHtmlElement</code></a> object representing the document's <a href="/en-US/docs/Web/HTML/Element/html" title="The HTML <html> element represents the root (top-level element) of an HTML document, so it is also referred to as the root element. All other elements must be descendants of this element."><code>&lt;html&gt;</code></a> element.</div>
  </li>
  <li>
    <a href="">documentURI</a>
    <div>Returns the document location as a string.</div>
  </li>
  <li>
    <a href="">domain</a>
    <div>Gets/sets the domain of the current document.</div>
  </li>
  <li>
    <a href="">embeds</a>
    <div>Returns a list of the embedded <a href="/en-US/docs/Web/HTML/Element/embed" title="The HTML <embed> element embeds external content at the specified point in the document. This content is provided by an external application or other source of interactive content such as a browser plug-in."><code>&lt;embed&gt;</code></a> elements within the current document.</div>
  </li>
  <li>
    <a href="">featurePolicy</a>
    <div>Returns the <a href="/en-US/docs/Web/API/FeaturePolicy" title="The FeaturePolicy&nbsp;interface of the Feature Policy API represents the set of policies applied to the current execution context."><code>FeaturePolicy</code></a> interface which provides a simple API for introspecting the feature policies applied to a specific document.</div>
  </li>
  <li>
    <a href="">fonts</a>
    <div>Returns the <a href="/en-US/docs/Web/API/FontFaceSet" title="The FontFaceSet interface of the CSS Font Loading API&nbsp;manages the loading of font-faces&nbsp;and querying of&nbsp;their download&nbsp;status."><code>FontFaceSet</code></a> interface of the current document.</div>
  </li>
  <li>
    <a href="">forms</a>
    <div>Returns a list of the <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code></a> elements within the current document.</div>
  </li>
  <li>
    <a href="">fullscreenEnabled</a>
    <div>Indicates whether or not full-screen mode is available.</div>
  </li>
  <li>
    <a href="">head</a>
    <div>Returns the <a href="/en-US/docs/Web/HTML/Element/head" title="The HTML <head> element contains machine-readable information (metadata) about the document, like its title, scripts, and style sheets."><code>&lt;head&gt;</code></a> element of the current document.</div>
  </li>
  <li>
    <a href="">hidden</a>
    <div>Returns a Boolean value indicating if the page is considered hidden or not.</div>
  </li>
  <li>
    <a href="">images</a>
    <div>Returns a list of the images in the current document.</div>
  </li>
  <li>
    <a href="">implementation</a>
    <div>Returns the DOM implementation associated with the current document.</div>
  </li>
  <li>
    <a href="">lastModified</a>
    <div>Returns the date on which the document was last modified.</div>
  </li>
  <li>
    <a href="">links</a>
    <div>Returns a list of all the hyperlinks in the document.</div>
  </li>
  <li>
    <a href="">location</a>
    <div>Returns the URI of the current document.</div>
  </li>
  <li>
    <a href="">onfullscreenchange</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/fullscreenchange" title="/en-US/docs/Web/Events/fullscreenchange">fullscreenchange</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onfullscreenerror</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/fullscreenerror" title="/en-US/docs/Web/Events/fullscreenerror">fullscreenerror</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpointerlockchange</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerlockchange" title="/en-US/docs/Web/Events/pointerlockchange">pointerlockchange</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpointerlockerror</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerlockerror" title="/en-US/docs/Web/Events/pointerlockerror">pointerlockerror</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onreadystatechange</a>
    <div>Represents the event handling code for the <code><a href="/en-US/docs/Web/Events/readystatechange" title="/en-US/docs/Web/Events/readystatechange">readystatechange</a></code> event.</div>
  </li>
  <li>
    <a href="">onvisibilitychange</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/visibilitychange" title="/en-US/docs/Web/Events/visibilitychange">visibilitychange</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">plugins</a>
    <div>Returns a list of the available plugins.</div>
  </li>
  <li>
    <a href="">readyState</a>
    <div>Returns loading status of the document.</div>
  </li>
  <li>
    <a href="">referrer</a>
    <div>Returns the URI of the page that linked to this page.</div>
  </li>
  <li>
    <a href="">scripts</a>
    <div>Returns all the <a href="/en-US/docs/Web/HTML/Element/script" title="The HTML <script> element is used to embed or reference executable code; this is typically used to embed or refer to JavaScript code."><code>&lt;script&gt;</code></a> elements on the document.</div>
  </li>
  <li>
    <a href="">scrollingElement</a>
    <div>Returns a reference to the <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a> that scrolls the document.</div>
  </li>
  <li>
    <a href="">title</a>
    <div>Sets or gets the title of the current document.</div>
  </li>
  <li>
    <a href="">URL</a>
    <div>Returns the document location as a string.</div>
  </li>
  <li>
    <a href="">visibilityState</a>
    <div>Returns a <code>string</code> denoting the visibility state of the document. Possible values are <code>visible</code>, <code>hidden</code>, <code>prerender</code>, and <code>unloaded</code>.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">adoptNode()</a>
    <div>Adopt node from an external document.</div>
  </li>
  <li>
    <a href="">captureEvents()</a>
    <div>See <a href="/en-US/docs/Web/API/Window/captureEvents" title="The Window.captureEvents() method registers the window to capture all events of the specified type."><code>Window.captureEvents</code></a>.</div>
  </li>
  <li>
    <a href="">close()</a>
    <div>Closes a document stream for writing.</div>
  </li>
  <li>
    <a href="">createAttribute()</a>
    <div>Creates a new <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a> object and returns it.</div>
  </li>
  <li>
    <a href="">createAttributeNS()</a>
    <div>Creates a new attribute node in a given namespace and returns it.</div>
  </li>
  <li>
    <a href="">createCDATASection()</a>
    <div>Creates a new CDATA node and returns it.</div>
  </li>
  <li>
    <a href="">createComment()</a>
    <div>Creates a new comment node and returns it.</div>
  </li>
  <li>
    <a href="">createDocumentFragment()</a>
    <div>Creates a new document fragment.</div>
  </li>
  <li>
    <a href="">createElement()</a>
    <div>Creates a new element with the given tag name.</div>
  </li>
  <li>
    <a href="">createElementNS()</a>
    <div>Creates a new element with the given tag name and namespace URI.</div>
  </li>
  <li>
    <a href="">createEvent()</a>
    <div>Creates an event object.</div>
  </li>
  <li>
    <a href="">createNodeIterator()</a>
    <div>Creates a <a href="/en-US/docs/Web/API/NodeIterator" title="The NodeIterator interface represents an iterator over the members of a list of the nodes in a subtree of the DOM. The nodes will be returned in document order."><code>NodeIterator</code></a> object.</div>
  </li>
  <li>
    <a href="">createProcessingInstruction()</a>
    <div>Creates a new <a href="/en-US/docs/Web/API/ProcessingInstruction" title="The ProcessingInstruction interface represents a processing instruction; that is, a Node which embeds an instruction targeting a specific application but that can be ignored by any other applications which don't recognize the instruction."><code>ProcessingInstruction</code></a> object.</div>
  </li>
  <li>
    <a href="">createRange()</a>
    <div>Creates a <a href="/en-US/docs/Web/API/Range" title="The Range interface represents a fragment of a document that can contain nodes and parts of text nodes."><code>Range</code></a> object.</div>
  </li>
  <li>
    <a href="">createTextNode()</a>
    <div>Creates a text node.</div>
  </li>
  <li>
    <a href="">createTreeWalker()</a>
    <div>Creates a <a href="/en-US/docs/Web/API/TreeWalker" title="The TreeWalker object represents the nodes of a document subtree and a position within them."><code>TreeWalker</code></a> object.</div>
  </li>
  <li>
    <a href="">exitFullscreen()</a>
    <div>Requests that the element on this document which is currently being presented in full-screen mode be taken out of full-screen mode, restoring the previous state of the screen.</div>
  </li>
  <li>
    <a href="">exitPointerLock()</a>
    <div>Release the pointer lock.</div>
  </li>
  <li>
    <a href="">getElementsByClassName()</a>
    <div>Returns a list of elements with the given class name.</div>
  </li>
  <li>
    <a href="">getElementsByName()</a>
    <div>Returns a list of elements with the given name.</div>
  </li>
  <li>
    <a href="">getElementsByTagName()</a>
    <div>Returns a list of elements with the given tag name.</div>
  </li>
  <li>
    <a href="">getElementsByTagNameNS()</a>
    <div>Returns a list of elements with the given tag name and namespace.</div>
  </li>
  <li>
    <a href="">getSelection()</a>
    <div>Returns a <a href="/en-US/docs/Web/API/Selection" title="A Selection object represents the range of text selected by the user or the current position of the caret. To obtain a Selection object for examination or manipulation, call window.getSelection()."><code>Selection</code></a> object representing the range of text selected by the user, or the current position of the caret.</div>
  </li>
  <li>
    <a href="">hasFocus()</a>
    <div>Returns <code>true</code> if the focus is currently located anywhere inside the specified document.</div>
  </li>
  <li>
    <a href="">importNode()</a>
    <div>Returns a clone of a node from an external document.</div>
  </li>
  <li>
    <a href="">open()</a>
    <div>Opens a document stream for writing.</div>
  </li>
  <li>
    <a href="">releaseEvents()</a>
    <div>See <a href="/en-US/docs/Web/API/Window/releaseEvents" title="Releases the window from trapping events of a specific type."><code>Window.releaseEvents()</code></a>.</div>
  </li>
  <li>
    <a href="">write()</a>
    <div>Writes text in a document.</div>
  </li>
  <li>
    <a href="">writeln()</a>
    <div>Writes a line of text in a document.</div>
  </li>
</ul>

## Events
