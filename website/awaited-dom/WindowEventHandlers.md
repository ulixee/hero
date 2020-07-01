# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> WindowEventHandlers

<div class='overview'>The <strong><code>WindowEventHandlers</code></strong> mixin describes the event handlers common to several interfaces like <a href="/en-US/docs/Web/API/Window" title="The Window interface represents a window containing a DOM document; the document property points to the DOM document loaded in that window."><code>Window</code></a>, or <a href="/en-US/docs/Web/API/HTMLBodyElement" title="The HTMLBodyElement interface provides special properties (beyond those inherited from the regular HTMLElement interface) for manipulating <body> elements."><code>HTMLBodyElement</code></a> and <a href="/en-US/docs/Web/API/HTMLFrameSetElement" title="The HTMLFrameSetElement interface provides special properties (beyond those of the regular HTMLElement interface they also inherit) for manipulating <frameset> elements."><code>HTMLFrameSetElement</code></a>. Each of these interfaces can implement additional specific event handlers.</div>

## Properties

### .onafterprint <div class="specs"><i>W3C</i></div> {#onafterprint}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/afterprint" title="/en-US/docs/Web/Events/afterprint">afterprint</a>
</code> event is raised.

#### **Type**: `null`

### .onbeforeprint <div class="specs"><i>W3C</i></div> {#onbeforeprint}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/beforeprint" title="/en-US/docs/Web/Events/beforeprint">beforeprint</a>
</code> event is raised.

#### **Type**: `null`

### .onbeforeunload <div class="specs"><i>W3C</i></div> {#onbeforeunload}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/beforeunload" title="/en-US/docs/Web/Events/beforeunload">beforeunload</a>
</code> event is raised.

#### **Type**: `null`

### .onhashchange <div class="specs"><i>W3C</i></div> {#onhashchange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/hashchange" title="/en-US/docs/Web/Events/hashchange">hashchange</a>
</code> event is raised.

#### **Type**: `null`

### .onlanguagechange <div class="specs"><i>W3C</i></div> {#onlanguagechange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/languagechange" title="/en-US/docs/Web/Events/languagechange">languagechange</a>
</code> event is raised.

#### **Type**: `null`

### .onmessage <div class="specs"><i>W3C</i></div> {#onmessage}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/message" title="/en-US/docs/Web/Events/message">message</a>
</code> event is raised.

#### **Type**: `null`

### .onmessageerror <div class="specs"><i>W3C</i></div> {#onmessageerror}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/MessageError" title="/en-US/docs/Web/Events/MessageError">MessageError</a>
</code> event is raised.

#### **Type**: `null`

### .onpopstate <div class="specs"><i>W3C</i></div> {#onpopstate}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/popstate" title="/en-US/docs/Web/Events/popstate">popstate</a>
</code> event is raised.

#### **Type**: `null`

### .onrejectionhandled <div class="specs"><i>W3C</i></div> {#onrejectionhandled}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/rejectionhandled" title="/en-US/docs/Web/Events/rejectionhandled">rejectionhandled</a></code> event is raised, indicating that a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" title="The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value."><code>Promise</code>
</a> was rejected and the rejection has been handled.

#### **Type**: `null`

### .onstorage <div class="specs"><i>W3C</i></div> {#onstorage}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/storage" title="/en-US/docs/Web/Events/storage">storage</a>
</code> event is raised.

#### **Type**: `null`

### .onunhandledrejection <div class="specs"><i>W3C</i></div> {#onunhandledrejection}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/unhandledrejection" title="/en-US/docs/Web/Events/unhandledrejection">unhandledrejection</a></code> event is raised, indicating that a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" title="The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value."><code>Promise</code>
</a> was rejected but the rejection was not handled.

#### **Type**: `null`

### .onunload <div class="specs"><i>W3C</i></div> {#onunload}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/unload" title="/en-US/docs/Web/Events/unload">unload</a>
</code> event is raised.

#### **Type**: `null`
