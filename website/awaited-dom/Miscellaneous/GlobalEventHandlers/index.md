# GlobalEventHandlers

<div class='overview'><span class="seoSummary">The <strong><code>GlobalEventHandlers</code></strong> mixin describes the event handlers common to several interfaces like <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a>, <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a>, or <a href="/en-US/docs/Web/API/Window" title="The Window interface represents a window containing a DOM document; the document property points to the DOM document loaded in that window."><code>Window</code></a>.</span> Each of these interfaces can, of course, add more event handlers in addition to the ones listed below.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">onabort</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <a href="/en-US/docs/Web/API/HTMLMediaElement/abort_event" title="The abort event is fired when the resource was not fully loaded, but not as the result of an error."><code>abort</code></a> event is raised.</div>
  </li>
  <li>
    <a href="">onanimationend</a>
    <div>An <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when an <code><a href="/en-US/docs/Web/Events/animationend" title="/en-US/docs/Web/Events/animationend">animationend</a></code> event is sent, indicating that a <a href="/en-US/docs/Web/CSS/CSS_Animations">CSS animation</a> has stopped playing.</div>
  </li>
  <li>
    <a href="">onanimationiteration</a>
    <div>An <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when an <code><a href="/en-US/docs/Web/Events/animationiteration" title="/en-US/docs/Web/Events/animationiteration">animationiteration</a></code> event has been sent, indicating that a <a href="/en-US/docs/Web/CSS/CSS_Animations">CSS animation</a> has begun playing a new iteration of the animation sequence.</div>
  </li>
  <li>
    <a href="">onanimationstart</a>
    <div>An <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when an <code><a href="/en-US/docs/Web/Events/animationstart" title="/en-US/docs/Web/Events/animationstart">animationstart</a></code> event is sent, indicating that a <a href="/en-US/docs/Web/CSS/CSS_Animations">CSS animation</a> has started playing.</div>
  </li>
  <li>
    <a href="">onauxclick</a>
    <div>An <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when an <code><a href="/en-US/docs/Web/Events/auxclick" title="/en-US/docs/Web/Events/auxclick">auxclick</a></code> event is sent, indicating that a non-primary button has been pressed on an input device (e.g. a middle mouse button).</div>
  </li>
  <li>
    <a href="">onblur</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/blur" title="/en-US/docs/Web/Events/blur">blur</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">oncancel</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/cancel" title="/en-US/docs/Web/Events/cancel">cancel</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">oncanplay</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/canplay" title="/en-US/docs/Web/Events/canplay">canplay</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">oncanplaythrough</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/canplaythrough" title="/en-US/docs/Web/Events/canplaythrough">canplaythrough</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onchange</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/change" title="/en-US/docs/Web/Events/change">change</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onclick</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/click" title="/en-US/docs/Web/Events/click">click</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onclose</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/close" title="/en-US/docs/Web/Events/close">close</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">oncontextmenu</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/contextmenu" title="/en-US/docs/Web/Events/contextmenu">contextmenu</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">oncuechange</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/cuechange" title="/en-US/docs/Web/Events/cuechange">cuechange</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ondblclick</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dblclick" title="/en-US/docs/Web/Events/dblclick">dblclick</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ondrag</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/drag" title="/en-US/docs/Web/Events/drag">drag</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ondragend</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dragend" title="/en-US/docs/Web/Events/dragend">dragend</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ondragenter</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dragenter" title="/en-US/docs/Web/Events/dragenter">dragenter</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ondragleave</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dragleave" title="/en-US/docs/Web/Events/dragleave">dragleave</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ondragover</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dragover" title="/en-US/docs/Web/Events/dragover">dragover</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ondragstart</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/dragstart" title="/en-US/docs/Web/Events/dragstart">dragstart</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ondrop</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/drop" title="/en-US/docs/Web/Events/drop">drop</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ondurationchange</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/durationchange" title="/en-US/docs/Web/Events/durationchange">durationchange</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onemptied</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/emptied" title="/en-US/docs/Web/Events/emptied">emptied</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onended</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/ended" title="/en-US/docs/Web/Events/ended">ended</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onerror</a>
    <div>Is an <a class="new" href="/en-US/docs/Web/API/OnErrorEventHandler" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>OnErrorEventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/error" title="/en-US/docs/Web/Events/error">error</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onfocus</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/focus" title="/en-US/docs/Web/Events/focus">focus</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onformdata</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> for processing <code><a class="new" href="/en-US/docs/Web/Events/formdata" rel="nofollow" title="/en-US/docs/Web/Events/formdata">formdata</a></code> events, fired after the entry list representing the form's data is constructed.</div>
  </li>
  <li>
    <a href="">ongotpointercapture</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/gotpointercapture" title="/en-US/docs/Web/Events/gotpointercapture">gotpointercapture</a></code> event type is raised.</div>
  </li>
  <li>
    <a href="">oninput</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/input" title="/en-US/docs/Web/Events/input">input</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">oninvalid</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/invalid" title="/en-US/docs/Web/Events/invalid">invalid</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onkeydown</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/keydown" title="/en-US/docs/Web/Events/keydown">keydown</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onkeypress</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/keypress" title="/en-US/docs/Web/Events/keypress">keypress</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onkeyup</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/keyup" title="/en-US/docs/Web/Events/keyup">keyup</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onload</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/load" title="/en-US/docs/Web/Events/load">load</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onloadeddata</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/loadeddata" title="/en-US/docs/Web/Events/loadeddata">loadeddata</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onloadedmetadata</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/loadedmetadata" title="/en-US/docs/Web/Events/loadedmetadata">loadedmetadata</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onloadstart</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/loadstart" title="/en-US/docs/Web/Events/loadstart">loadstart</a></code> event is raised (when progress has begun on the loading of a resource.)</div>
  </li>
  <li>
    <a href="">onlostpointercapture</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/lostpointercapture" title="/en-US/docs/Web/Events/lostpointercapture">lostpointercapture</a></code> event type is raised.</div>
  </li>
  <li>
    <a href="">onmousedown</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mousedown" title="/en-US/docs/Web/Events/mousedown">mousedown</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onmouseenter</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mouseenter" title="/en-US/docs/Web/Events/mouseenter">mouseenter</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onmouseleave</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mouseleave" title="/en-US/docs/Web/Events/mouseleave">mouseleave</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onmousemove</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mousemove" title="/en-US/docs/Web/Events/mousemove">mousemove</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onmouseout</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mouseout" title="/en-US/docs/Web/Events/mouseout">mouseout</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onmouseover</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mouseover" title="/en-US/docs/Web/Events/mouseover">mouseover</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onmouseup</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/mouseup" title="/en-US/docs/Web/Events/mouseup">mouseup</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpause</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pause" title="/en-US/docs/Web/Events/pause">pause</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onplay</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/play" title="/en-US/docs/Web/Events/play">play</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onplaying</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/playing" title="/en-US/docs/Web/Events/playing">playing</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpointercancel</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointercancel" title="/en-US/docs/Web/Events/pointercancel">pointercancel</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpointerdown</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerdown" title="/en-US/docs/Web/Events/pointerdown">pointerdown</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpointerenter</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerenter" title="/en-US/docs/Web/Events/pointerenter">pointerenter</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpointerleave</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerleave" title="/en-US/docs/Web/Events/pointerleave">pointerleave</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpointermove</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointermove" title="/en-US/docs/Web/Events/pointermove">pointermove</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpointerout</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerout" title="/en-US/docs/Web/Events/pointerout">pointerout</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpointerover</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerover" title="/en-US/docs/Web/Events/pointerover">pointerover</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onpointerup</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/pointerup" title="/en-US/docs/Web/Events/pointerup">pointerup</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onprogress</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/progress" title="/en-US/docs/Web/Events/progress">progress</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onratechange</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/ratechange" title="/en-US/docs/Web/Events/ratechange">ratechange</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onreset</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/reset" title="/en-US/docs/Web/Events/reset">reset</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onresize</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/resize" title="/en-US/docs/Web/Events/resize">resize</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onscroll</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/scroll" title="/en-US/docs/Web/Events/scroll">scroll</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onseeked</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/seeked" title="/en-US/docs/Web/Events/seeked">seeked</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onseeking</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/seeking" title="/en-US/docs/Web/Events/seeking">seeking</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onselect</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/select" title="/en-US/docs/Web/Events/select">select</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onselectionchange</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/selectionchange" title="/en-US/docs/Web/Events/selectionchange">selectionchange</a></code> event is raised, i.e. when the text selected on a web page changes.</div>
  </li>
  <li>
    <a href="">onselectstart</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/selectionchange" title="/en-US/docs/Web/Events/selectionchange">selectionchange</a></code> event is raised, i.e. when the user starts to make a new text selection on a web page.</div>
  </li>
  <li>
    <a href="">onstalled</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/stalled" title="/en-US/docs/Web/Events/stalled">stalled</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onsubmit</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/submit" title="/en-US/docs/Web/Events/submit">submit</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onsuspend</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/suspend" title="/en-US/docs/Web/Events/suspend">suspend</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ontimeupdate</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/timeupdate" title="/en-US/docs/Web/Events/timeupdate">timeupdate</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ontouchcancel</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/touchcancel" title="/en-US/docs/Web/Events/touchcancel">touchcancel</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ontouchend</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/touchend" title="/en-US/docs/Web/Events/touchend">touchend</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ontouchmove</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/touchmove" title="/en-US/docs/Web/Events/touchmove">touchmove</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ontouchstart</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/touchstart" title="/en-US/docs/Web/Events/touchstart">touchstart</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">ontransitionend</a>
    <div>An <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when a <code><a href="/en-US/docs/Web/Events/transitionend" title="/en-US/docs/Web/Events/transitionend">transitionend</a></code> event is sent, indicating that a <a href="/en-US/docs/Web/CSS/CSS_Transitions">CSS transition</a> has finished playing.</div>
  </li>
  <li>
    <a href="">onvolumechange</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/volumechange" title="/en-US/docs/Web/Events/volumechange">volumechange</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onwaiting</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/waiting" title="/en-US/docs/Web/Events/waiting">waiting</a></code> event is raised.</div>
  </li>
  <li>
    <a href="">onwheel</a>
    <div>Is an <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> representing the code to be called when the <code><a href="/en-US/docs/Web/Events/wheel" title="/en-US/docs/Web/Events/wheel">wheel</a></code> event is raised.</div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
