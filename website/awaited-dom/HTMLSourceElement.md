# HTMLSourceElement

<div class='overview'>The <strong><code>HTMLSourceElement</code></strong> interface provides special properties (beyond the regular <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> object interface it also has available to it by inheritance) for manipulating <a href="/en-US/docs/Web/HTML/Element/source" title="The HTML <source> element specifies multiple media resources for the <picture>, the <audio> element, or the <video> element."><code>&lt;source&gt;</code></a> elements.</div>

## Properties

### .media <div class="specs"><i>W3C</i></div> {#media}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/source#attr-media">media</a></code> HTML attribute, containing the intended type of the media resource.

#### **Type**: `null`

### .sizes <div class="specs"><i>W3C</i></div> {#sizes}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing&nbsp;image sizes between breakpoints

#### **Type**: `null`

### .src <div class="specs"><i>W3C</i></div> {#src}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/source#attr-src">src</a></code> HTML attribute, containing the URL for the media resource. The <a class="new" href="/en-US/docs/Web/API/HTMLSourceElement/src" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>HTMLSourceElement.src</code></a> property has a meaning only when the associated <a href="/en-US/docs/Web/HTML/Element/source" title="The HTML <source> element specifies multiple media resources for the <picture>, the <audio> element, or the <video> element."><code>&lt;source&gt;</code></a> element is nested in a media element that is a <a href="/en-US/docs/Web/HTML/Element/video" title="The&nbsp;HTML Video element&nbsp;(<video>) embeds a media player which supports video playback into the document.&nbsp;You can use&nbsp;<video>&nbsp;for audio content as well, but the <audio> element may provide a more appropriate user experience."><code>&lt;video&gt;</code></a> or an <a href="/en-US/docs/Web/HTML/Element/audio" title="The HTML <audio> element is used to embed sound content in documents. It may contain one or more audio sources, represented using the src attribute or the <source> element:&nbsp;the browser will choose the most suitable one. It can also be the destination for streamed media, using a MediaStream."><code>&lt;audio&gt;</code></a> element. It has no meaning and is ignored when it is nested in a <a href="/en-US/docs/Web/HTML/Element/picture" title="The HTML <picture> element contains zero or more <source> elements and one <img> element to offer alternative versions of an image for different display/device scenarios."><code>&lt;picture&gt;</code></a> element.&nbsp;
 <div class="note"><strong>Note</strong>: If the&nbsp;<code>src</code>&nbsp;property is updated (along with any siblings), the parent&nbsp;<a href="/en-US/docs/Web/API/HTMLMediaElement" title="The HTMLMediaElement interface adds to HTMLElement the properties and methods needed to support basic media-related capabilities that are common to audio and video."><code>HTMLMediaElement</code></a>'s&nbsp;<code>load</code> method should be called when done, since&nbsp;<code>&lt;source&gt;</code>&nbsp;elements are not re-scanned automatically.</div>
 

#### **Type**: `null`

### .srcset <div class="specs"><i>W3C</i></div> {#srcset}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/source#attr-srcset">srcset</a></code> HTML attribute, containing a list of candidate images, separated by a comma (<code>',', U+002C COMMA</code>). A candidate image is a URL followed by a <code>'w'</code> with the width of the images, or an <code>'x'</code> followed by the pixel density.

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/source#attr-type">type</a></code> HTML attribute, containing the type of the media resource.

#### **Type**: `null`

## Methods

## Events
