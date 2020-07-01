# GlobalEventHandlers

<div class='overview'><span class="seoSummary">The <strong><code>GlobalEventHandlers</code></strong> mixin describes the event handlers common to several interfaces like <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a>, <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a>, or <a href="/en-US/docs/Web/API/Window" title="The Window interface represents a window containing a DOM document; the document property points to the DOM document loaded in that window."><code>Window</code></a>.</span> Each of these interfaces can, of course, add more event handlers in addition to the ones listed below.</div>

## Properties

### .onabort <div class="specs"><i>W3C</i></div> {#onabort}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <a href="/en-US/docs/Web/API/HTMLMediaElement/abort_event" title="The abort event is fired when the resource was not fully loaded, but not as the result of an error."><code>abort</code></a> event is raised.

#### **Type**: `null`

### .onanimationend <div class="specs"><i>W3C</i></div> {#onanimationend}

An <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when an <code><a href="/en-US/docs/Web/Events/animationend" title="/en-US/docs/Web/Events/animationend">animationend</a></code> event is sent, indicating that a <a href="/en-US/docs/Web/CSS/CSS_Animations">CSS animation</a> has stopped playing.

#### **Type**: `null`

### .onanimationiteration <div class="specs"><i>W3C</i></div> {#onanimationiteration}

An <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when an <code><a href="/en-US/docs/Web/Events/animationiteration" title="/en-US/docs/Web/Events/animationiteration">animationiteration</a></code> event has been sent, indicating that a <a href="/en-US/docs/Web/CSS/CSS_Animations">CSS animation</a> has begun playing a new iteration of the animation sequence.

#### **Type**: `null`

### .onanimationstart <div class="specs"><i>W3C</i></div> {#onanimationstart}

An <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when an <code><a href="/en-US/docs/Web/Events/animationstart" title="/en-US/docs/Web/Events/animationstart">animationstart</a></code> event is sent, indicating that a <a href="/en-US/docs/Web/CSS/CSS_Animations">CSS animation</a> has started playing.

#### **Type**: `null`

### .onauxclick <div class="specs"><i>W3C</i></div> {#onauxclick}

An <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when an <code><a href="/en-US/docs/Web/Events/auxclick" title="/en-US/docs/Web/Events/auxclick">auxclick</a></code> event is sent, indicating that a non-primary button has been pressed on an input device (e.g. a middle mouse button).

#### **Type**: `null`

### .onblur <div class="specs"><i>W3C</i></div> {#onblur}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/blur" title="/en-US/docs/Web/Events/blur">blur</a></code> event is raised.

#### **Type**: `null`

### .oncancel <div class="specs"><i>W3C</i></div> {#oncancel}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/cancel" title="/en-US/docs/Web/Events/cancel">cancel</a></code> event is raised.

#### **Type**: `null`

### .oncanplay <div class="specs"><i>W3C</i></div> {#oncanplay}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/canplay" title="/en-US/docs/Web/Events/canplay">canplay</a></code> event is raised.

#### **Type**: `null`

### .oncanplaythrough <div class="specs"><i>W3C</i></div> {#oncanplaythrough}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/canplaythrough" title="/en-US/docs/Web/Events/canplaythrough">canplaythrough</a></code> event is raised.

#### **Type**: `null`

### .onchange <div class="specs"><i>W3C</i></div> {#onchange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/change" title="/en-US/docs/Web/Events/change">change</a></code> event is raised.

#### **Type**: `null`

### .onclick <div class="specs"><i>W3C</i></div> {#onclick}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/click" title="/en-US/docs/Web/Events/click">click</a></code> event is raised.

#### **Type**: `null`

### .onclose <div class="specs"><i>W3C</i></div> {#onclose}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/close" title="/en-US/docs/Web/Events/close">close</a></code> event is raised.

#### **Type**: `null`

### .oncontextmenu <div class="specs"><i>W3C</i></div> {#oncontextmenu}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/contextmenu" title="/en-US/docs/Web/Events/contextmenu">contextmenu</a></code> event is raised.

#### **Type**: `null`

### .oncuechange <div class="specs"><i>W3C</i></div> {#oncuechange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/cuechange" title="/en-US/docs/Web/Events/cuechange">cuechange</a></code> event is raised.

#### **Type**: `null`

### .ondblclick <div class="specs"><i>W3C</i></div> {#ondblclick}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dblclick" title="/en-US/docs/Web/Events/dblclick">dblclick</a></code> event is raised.

#### **Type**: `null`

### .ondrag <div class="specs"><i>W3C</i></div> {#ondrag}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/drag" title="/en-US/docs/Web/Events/drag">drag</a></code> event is raised.

#### **Type**: `null`

### .ondragend <div class="specs"><i>W3C</i></div> {#ondragend}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dragend" title="/en-US/docs/Web/Events/dragend">dragend</a></code> event is raised.

#### **Type**: `null`

### .ondragenter <div class="specs"><i>W3C</i></div> {#ondragenter}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dragenter" title="/en-US/docs/Web/Events/dragenter">dragenter</a></code> event is raised.

#### **Type**: `null`

### .ondragleave <div class="specs"><i>W3C</i></div> {#ondragleave}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dragleave" title="/en-US/docs/Web/Events/dragleave">dragleave</a></code> event is raised.

#### **Type**: `null`

### .ondragover <div class="specs"><i>W3C</i></div> {#ondragover}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dragover" title="/en-US/docs/Web/Events/dragover">dragover</a></code> event is raised.

#### **Type**: `null`

### .ondragstart <div class="specs"><i>W3C</i></div> {#ondragstart}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dragstart" title="/en-US/docs/Web/Events/dragstart">dragstart</a></code> event is raised.

#### **Type**: `null`

### .ondrop <div class="specs"><i>W3C</i></div> {#ondrop}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/drop" title="/en-US/docs/Web/Events/drop">drop</a></code> event is raised.

#### **Type**: `null`

### .ondurationchange <div class="specs"><i>W3C</i></div> {#ondurationchange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/durationchange" title="/en-US/docs/Web/Events/durationchange">durationchange</a></code> event is raised.

#### **Type**: `null`

### .onemptied <div class="specs"><i>W3C</i></div> {#onemptied}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/emptied" title="/en-US/docs/Web/Events/emptied">emptied</a></code> event is raised.

#### **Type**: `null`

### .onended <div class="specs"><i>W3C</i></div> {#onended}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/ended" title="/en-US/docs/Web/Events/ended">ended</a></code> event is raised.

#### **Type**: `null`

### .onerror <div class="specs"><i>W3C</i></div> {#onerror}

Is an <a class="new" href="/en-US/docs/Web/API/OnErrorEventHandler" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>OnErrorEventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/error" title="/en-US/docs/Web/Events/error">error</a></code> event is raised.

#### **Type**: `null`

### .onfocus <div class="specs"><i>W3C</i></div> {#onfocus}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/focus" title="/en-US/docs/Web/Events/focus">focus</a></code> event is raised.

#### **Type**: `null`

### .onformdata <div class="specs"><i>W3C</i></div> {#onformdata}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> for processing <code><a class="new" href="/en-US/docs/Web/Events/formdata" rel="nofollow" title="/en-US/docs/Web/Events/formdata">formdata</a></code> events, fired after the entry list representing the form's data is constructed.

#### **Type**: `null`

### .ongotpointercapture <div class="specs"><i>W3C</i></div> {#ongotpointercapture}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/gotpointercapture" title="/en-US/docs/Web/Events/gotpointercapture">gotpointercapture</a></code> event type is raised.

#### **Type**: `null`

### .oninput <div class="specs"><i>W3C</i></div> {#oninput}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/input" title="/en-US/docs/Web/Events/input">input</a></code> event is raised.

#### **Type**: `null`

### .oninvalid <div class="specs"><i>W3C</i></div> {#oninvalid}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/invalid" title="/en-US/docs/Web/Events/invalid">invalid</a></code> event is raised.

#### **Type**: `null`

### .onkeydown <div class="specs"><i>W3C</i></div> {#onkeydown}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/keydown" title="/en-US/docs/Web/Events/keydown">keydown</a></code> event is raised.

#### **Type**: `null`

### .onkeypress <div class="specs"><i>W3C</i></div> {#onkeypress}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/keypress" title="/en-US/docs/Web/Events/keypress">keypress</a></code> event is raised.

#### **Type**: `null`

### .onkeyup <div class="specs"><i>W3C</i></div> {#onkeyup}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/keyup" title="/en-US/docs/Web/Events/keyup">keyup</a></code> event is raised.

#### **Type**: `null`

### .onload <div class="specs"><i>W3C</i></div> {#onload}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/load" title="/en-US/docs/Web/Events/load">load</a></code> event is raised.

#### **Type**: `null`

### .onloadeddata <div class="specs"><i>W3C</i></div> {#onloadeddata}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/loadeddata" title="/en-US/docs/Web/Events/loadeddata">loadeddata</a></code> event is raised.

#### **Type**: `null`

### .onloadedmetadata <div class="specs"><i>W3C</i></div> {#onloadedmetadata}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/loadedmetadata" title="/en-US/docs/Web/Events/loadedmetadata">loadedmetadata</a></code> event is raised.

#### **Type**: `null`

### .onloadstart <div class="specs"><i>W3C</i></div> {#onloadstart}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/loadstart" title="/en-US/docs/Web/Events/loadstart">loadstart</a></code> event is raised (when progress has begun on the loading of a resource.)

#### **Type**: `null`

### .onlostpointercapture <div class="specs"><i>W3C</i></div> {#onlostpointercapture}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/lostpointercapture" title="/en-US/docs/Web/Events/lostpointercapture">lostpointercapture</a></code> event type is raised.

#### **Type**: `null`

### .onmousedown <div class="specs"><i>W3C</i></div> {#onmousedown}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mousedown" title="/en-US/docs/Web/Events/mousedown">mousedown</a></code> event is raised.

#### **Type**: `null`

### .onmouseenter <div class="specs"><i>W3C</i></div> {#onmouseenter}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mouseenter" title="/en-US/docs/Web/Events/mouseenter">mouseenter</a></code> event is raised.

#### **Type**: `null`

### .onmouseleave <div class="specs"><i>W3C</i></div> {#onmouseleave}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mouseleave" title="/en-US/docs/Web/Events/mouseleave">mouseleave</a></code> event is raised.

#### **Type**: `null`

### .onmousemove <div class="specs"><i>W3C</i></div> {#onmousemove}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mousemove" title="/en-US/docs/Web/Events/mousemove">mousemove</a></code> event is raised.

#### **Type**: `null`

### .onmouseout <div class="specs"><i>W3C</i></div> {#onmouseout}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mouseout" title="/en-US/docs/Web/Events/mouseout">mouseout</a></code> event is raised.

#### **Type**: `null`

### .onmouseover <div class="specs"><i>W3C</i></div> {#onmouseover}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mouseover" title="/en-US/docs/Web/Events/mouseover">mouseover</a></code> event is raised.

#### **Type**: `null`

### .onmouseup <div class="specs"><i>W3C</i></div> {#onmouseup}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mouseup" title="/en-US/docs/Web/Events/mouseup">mouseup</a></code> event is raised.

#### **Type**: `null`

### .onpause <div class="specs"><i>W3C</i></div> {#onpause}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pause" title="/en-US/docs/Web/Events/pause">pause</a></code> event is raised.

#### **Type**: `null`

### .onplay <div class="specs"><i>W3C</i></div> {#onplay}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/play" title="/en-US/docs/Web/Events/play">play</a></code> event is raised.

#### **Type**: `null`

### .onplaying <div class="specs"><i>W3C</i></div> {#onplaying}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/playing" title="/en-US/docs/Web/Events/playing">playing</a></code> event is raised.

#### **Type**: `null`

### .onpointercancel <div class="specs"><i>W3C</i></div> {#onpointercancel}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointercancel" title="/en-US/docs/Web/Events/pointercancel">pointercancel</a></code> event is raised.

#### **Type**: `null`

### .onpointerdown <div class="specs"><i>W3C</i></div> {#onpointerdown}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerdown" title="/en-US/docs/Web/Events/pointerdown">pointerdown</a></code> event is raised.

#### **Type**: `null`

### .onpointerenter <div class="specs"><i>W3C</i></div> {#onpointerenter}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerenter" title="/en-US/docs/Web/Events/pointerenter">pointerenter</a></code> event is raised.

#### **Type**: `null`

### .onpointerleave <div class="specs"><i>W3C</i></div> {#onpointerleave}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerleave" title="/en-US/docs/Web/Events/pointerleave">pointerleave</a></code> event is raised.

#### **Type**: `null`

### .onpointermove <div class="specs"><i>W3C</i></div> {#onpointermove}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointermove" title="/en-US/docs/Web/Events/pointermove">pointermove</a></code> event is raised.

#### **Type**: `null`

### .onpointerout <div class="specs"><i>W3C</i></div> {#onpointerout}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerout" title="/en-US/docs/Web/Events/pointerout">pointerout</a></code> event is raised.

#### **Type**: `null`

### .onpointerover <div class="specs"><i>W3C</i></div> {#onpointerover}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerover" title="/en-US/docs/Web/Events/pointerover">pointerover</a></code> event is raised.

#### **Type**: `null`

### .onpointerup <div class="specs"><i>W3C</i></div> {#onpointerup}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerup" title="/en-US/docs/Web/Events/pointerup">pointerup</a></code> event is raised.

#### **Type**: `null`

### .onprogress <div class="specs"><i>W3C</i></div> {#onprogress}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/progress" title="/en-US/docs/Web/Events/progress">progress</a></code> event is raised.

#### **Type**: `null`

### .onratechange <div class="specs"><i>W3C</i></div> {#onratechange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/ratechange" title="/en-US/docs/Web/Events/ratechange">ratechange</a></code> event is raised.

#### **Type**: `null`

### .onreset <div class="specs"><i>W3C</i></div> {#onreset}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/reset" title="/en-US/docs/Web/Events/reset">reset</a></code> event is raised.

#### **Type**: `null`

### .onresize <div class="specs"><i>W3C</i></div> {#onresize}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/resize" title="/en-US/docs/Web/Events/resize">resize</a></code> event is raised.

#### **Type**: `null`

### .onscroll <div class="specs"><i>W3C</i></div> {#onscroll}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/scroll" title="/en-US/docs/Web/Events/scroll">scroll</a></code> event is raised.

#### **Type**: `null`

### .onseeked <div class="specs"><i>W3C</i></div> {#onseeked}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/seeked" title="/en-US/docs/Web/Events/seeked">seeked</a></code> event is raised.

#### **Type**: `null`

### .onseeking <div class="specs"><i>W3C</i></div> {#onseeking}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/seeking" title="/en-US/docs/Web/Events/seeking">seeking</a></code> event is raised.

#### **Type**: `null`

### .onselect <div class="specs"><i>W3C</i></div> {#onselect}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/select" title="/en-US/docs/Web/Events/select">select</a></code> event is raised.

#### **Type**: `null`

### .onselectionchange <div class="specs"><i>W3C</i></div> {#onselectionchange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/selectionchange" title="/en-US/docs/Web/Events/selectionchange">selectionchange</a></code> event is raised, i.e. when the text selected on a web page changes.

#### **Type**: `null`

### .onselectstart <div class="specs"><i>W3C</i></div> {#onselectstart}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/selectionchange" title="/en-US/docs/Web/Events/selectionchange">selectionchange</a></code> event is raised, i.e. when the user starts to make a new text selection on a web page.

#### **Type**: `null`

### .onstalled <div class="specs"><i>W3C</i></div> {#onstalled}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/stalled" title="/en-US/docs/Web/Events/stalled">stalled</a></code> event is raised.

#### **Type**: `null`

### .onsubmit <div class="specs"><i>W3C</i></div> {#onsubmit}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/submit" title="/en-US/docs/Web/Events/submit">submit</a></code> event is raised.

#### **Type**: `null`

### .onsuspend <div class="specs"><i>W3C</i></div> {#onsuspend}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/suspend" title="/en-US/docs/Web/Events/suspend">suspend</a></code> event is raised.

#### **Type**: `null`

### .ontimeupdate <div class="specs"><i>W3C</i></div> {#ontimeupdate}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/timeupdate" title="/en-US/docs/Web/Events/timeupdate">timeupdate</a></code> event is raised.

#### **Type**: `null`

### .ontouchcancel <div class="specs"><i>W3C</i></div> {#ontouchcancel}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/touchcancel" title="/en-US/docs/Web/Events/touchcancel">touchcancel</a></code> event is raised.

#### **Type**: `null`

### .ontouchend <div class="specs"><i>W3C</i></div> {#ontouchend}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/touchend" title="/en-US/docs/Web/Events/touchend">touchend</a></code> event is raised.

#### **Type**: `null`

### .ontouchmove <div class="specs"><i>W3C</i></div> {#ontouchmove}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/touchmove" title="/en-US/docs/Web/Events/touchmove">touchmove</a></code> event is raised.

#### **Type**: `null`

### .ontouchstart <div class="specs"><i>W3C</i></div> {#ontouchstart}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/touchstart" title="/en-US/docs/Web/Events/touchstart">touchstart</a></code> event is raised.

#### **Type**: `null`

### .ontransitionend <div class="specs"><i>W3C</i></div> {#ontransitionend}

An <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when a <code><a href="/en-US/docs/Web/Events/transitionend" title="/en-US/docs/Web/Events/transitionend">transitionend</a></code> event is sent, indicating that a <a href="/en-US/docs/Web/CSS/CSS_Transitions">CSS transition</a> has finished playing.

#### **Type**: `null`

### .onvolumechange <div class="specs"><i>W3C</i></div> {#onvolumechange}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/volumechange" title="/en-US/docs/Web/Events/volumechange">volumechange</a></code> event is raised.

#### **Type**: `null`

### .onwaiting <div class="specs"><i>W3C</i></div> {#onwaiting}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/waiting" title="/en-US/docs/Web/Events/waiting">waiting</a></code> event is raised.

#### **Type**: `null`

### .onwheel <div class="specs"><i>W3C</i></div> {#onwheel}

Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/wheel" title="/en-US/docs/Web/Events/wheel">wheel</a></code> event is raised.

#### **Type**: `null`

## Methods

## Events
