# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLAudioElement

<div class='overview'><span class="seoSummary">The <strong><code>HTMLAudioElement</code></strong> interface provides access to the properties of <code>&lt;audio&gt;</code> elements, as well as methods to manipulate them.</span> It's based on, and inherits properties and methods from,&nbsp;the <code>HTMLMediaElement</code> interface.</div>

## Properties

### elem.audioTracks <div class="specs"><i>W3C</i></div> {#audioTracks}

A <code>AudioTrackList</code> that lists the <code>AudioTrack</code> objects contained in the element.

#### **Type**: [`AudioTrackList`](/docs/awaited-dom/audio-track-list)

### elem.autoplay <div class="specs"><i>W3C</i></div> {#autoplay}


 <p>A `boolean` that reflects the <code>autoplay</code> HTML attribute, indicating whether playback should automatically begin as soon as enough media is available to do so without interruption.</p>
 <div class="note"><strong>Note</strong>: Automatically playing audio when the user doesn't expect or desire it is a poor user experience and should be avoided in most cases, though there are exceptions. See the Autoplay guide for media and Web Audio APIs for more information. Keep in mind that browsers may ignore autoplay requests, so you should ensure that your code isn't dependent on autoplay working.</div>
 

#### **Type**: `Promise<boolean>`

### elem.buffered <div class="specs"><i>W3C</i></div> {#buffered}

Returns a <code>TimeRanges</code> object that indicates the ranges of the media source that the browser has buffered (if any) at the moment the <code>buffered</code> property is accessed.

#### **Type**: [`TimeRanges`](/docs/awaited-dom/time-ranges)

### elem.controls <div class="specs"><i>W3C</i></div> {#controls}

Is a `boolean` that reflects the <code>controls</code> HTML attribute, indicating whether user interface items for controlling the resource should be displayed.

#### **Type**: `Promise<boolean>`

### elem.controlsList <div class="specs"><i>W3C</i></div> {#controlsList}

Returns a <code>DOMTokenList</code> that helps the user agent select what controls to show on the media element whenever the user agent shows its own set of controls. The <code>DOMTokenList</code> takes one or more of three possible values: <code>nodownload</code>, <code>nofullscreen</code>, and <code>noremoteplayback</code>.

#### **Type**: [`DOMTokenList`](/docs/awaited-dom/dom-token-list)

### elem.crossOrigin <div class="specs"><i>W3C</i></div> {#crossOrigin}

A `string` indicating the CORS setting for this media element.

#### **Type**: `Promise<string>`

### elem.currentSrc <div class="specs"><i>W3C</i></div> {#currentSrc}

Returns a `string` with the absolute URL of the chosen media resource.

#### **Type**: `Promise<string>`

### elem.currentTime <div class="specs"><i>W3C</i></div> {#currentTime}

A double-precision floating-point value indicating the current playback time in seconds; if the media has not started to play and has not been seeked, this value is the media's initial playback time. Setting this value seeks the media to the new time. The time is specified relative to the media's timeline.

#### **Type**: `Promise<number>`

### elem.defaultMuted <div class="specs"><i>W3C</i></div> {#defaultMuted}

A `boolean` that reflects the <code>muted</code> HTML attribute, which indicates whether the media element's audio output should be muted by default.

#### **Type**: `Promise<boolean>`

### elem.defaultPlaybackRate <div class="specs"><i>W3C</i></div> {#defaultPlaybackRate}

A <code>double</code> indicating the default playback rate for the media.

#### **Type**: `Promise<number>`

### elem.disableRemotePlayback <div class="specs"><i>W3C</i></div> {#disableRemotePlayback}

A `boolean` that sets or returns the remote playback state, indicating whether the media element is allowed to have a remote playback UI.

#### **Type**: `Promise<boolean>`

### elem.duration <div class="specs"><i>W3C</i></div> {#duration}

A read-only double-precision floating-point value indicating the total duration of the media in seconds. If no media data is available, the returned value is <code>NaN</code>. If the media is of indefinite length (such as streamed live media, a WebRTC call's media, or similar), the value is <code>+Infinity</code>.

#### **Type**: `Promise<number>`

### elem.ended <div class="specs"><i>W3C</i></div> {#ended}

Returns a `boolean` that indicates whether the media element has finished playing.

#### **Type**: `Promise<boolean>`

### elem.error <div class="specs"><i>W3C</i></div> {#error}

Returns a <code>MediaError</code> object for the most recent error, or <code>null</code> if there has not been an error.

#### **Type**: [`MediaError`](/docs/awaited-dom/media-error)

### elem.loop <div class="specs"><i>W3C</i></div> {#loop}

A `boolean` that reflects the <code>loop</code> HTML attribute, which indicates whether the media element should start over when it reaches the end.

#### **Type**: `Promise<boolean>`

### elem.mediaKeys <div class="specs"><i>W3C</i></div> {#mediaKeys}

Returns a <code>MediaKeys</code> object or <code>null</code>. MediaKeys is a set of keys that an associated HTMLMediaElement can use for decryption of media data during playback.

#### **Type**: `MediaKeys`

### elem.muted <div class="specs"><i>W3C</i></div> {#muted}

Is a `boolean` that determines whether audio is muted. <code>true</code> if the audio is muted and <code>false</code> otherwise.

#### **Type**: `Promise<boolean>`

### elem.networkState <div class="specs"><i>W3C</i></div> {#networkState}

Returns a <code>unsigned short</code> (enumeration) indicating the current state of fetching the media over the network.

#### **Type**: `Promise<number>`

### elem.playbackRate <div class="specs"><i>W3C</i></div> {#playbackRate}

Is a <code>double</code> that indicates the rate at which the media is being played back.

#### **Type**: `Promise<number>`

### elem.played <div class="specs"><i>W3C</i></div> {#played}

Returns a <code>TimeRanges</code> object that contains the ranges of the media source that the browser has played, if any.

#### **Type**: [`TimeRanges`](/docs/awaited-dom/time-ranges)

### elem.preload <div class="specs"><i>W3C</i></div> {#preload}

Is a `string` that reflects the <code>preload</code> HTML attribute, indicating what data should be preloaded, if any. Possible values are: <code>none</code>, <code>metadata</code>, <code>auto</code>.

#### **Type**: `Promise<string>`

### elem.readyState <div class="specs"><i>W3C</i></div> {#readyState}

Returns a <code>unsigned short</code> (enumeration) indicating the readiness state of the media.

#### **Type**: `Promise<number>`

### elem.seekable <div class="specs"><i>W3C</i></div> {#seekable}

Returns a <code>TimeRanges</code> object that contains the time ranges that the user is able to seek to, if any.

#### **Type**: [`TimeRanges`](/docs/awaited-dom/time-ranges)

### elem.seeking <div class="specs"><i>W3C</i></div> {#seeking}

Returns a `boolean` that indicates whether the media is in the process of seeking to a new position.

#### **Type**: `Promise<boolean>`

### elem.sinkId <div class="specs"><i>W3C</i></div> {#sinkId}

Returns a `string` that is the unique ID of the audio device delivering output, or an empty string if it is using the user agent default. This ID should be one of the <code>MediaDeviceInfo.deviceid</code> values returned from <code>MediaDevices.enumerateDevices()</code>, <code>id-multimedia</code>, or <code>id-communications</code>.

#### **Type**: `Promise<string>`

### elem.src <div class="specs"><i>W3C</i></div> {#src}

Is a `string` that reflects the <code>src</code> HTML attribute, which contains the URL of a media resource to use.

#### **Type**: `Promise<string>`

### elem.textTracks <div class="specs"><i>W3C</i></div> {#textTracks}

Returns the list of <code>TextTrack</code> objects contained in the element.

#### **Type**: [`TextTrackList`](/docs/awaited-dom/text-track-list)

### elem.videoTracks <div class="specs"><i>W3C</i></div> {#videoTracks}

Returns the list of <code>VideoTrack</code> objects contained in the element.

#### **Type**: [`VideoTrackList`](/docs/awaited-dom/video-track-list)

### elem.volume <div class="specs"><i>W3C</i></div> {#volume}

Is a <code>double</code> indicating the audio volume, from 0.0 (silent) to 1.0 (loudest).

#### **Type**: `Promise<number>`

### elem.accessKey <div class="specs"><i>W3C</i></div> {#accessKey}

Is a `string` representing the access key assigned to the element.

#### **Type**: `Promise<string>`

### elem.autoCapitalize <div class="specs"><i>W3C</i></div> {#autoCapitalize}

Needs content.

#### **Type**: `Promise<string>`

### elem.dir <div class="specs"><i>W3C</i></div> {#dir}

Is a `string`, reflecting the <code>dir</code> global attribute, representing the directionality of the element. Possible values are <code>"ltr"</code>, <code>"rtl"</code>, and <code>"auto"</code>.

#### **Type**: `Promise<string>`

### elem.draggable <div class="specs"><i>W3C</i></div> {#draggable}

Is a `boolean` indicating if the element can be dragged.

#### **Type**: `Promise<boolean>`

### elem.hidden <div class="specs"><i>W3C</i></div> {#hidden}

Is a `boolean` indicating if the element is hidden or not.

#### **Type**: `Promise<boolean>`

### elem.inert <div class="specs"><i>W3C</i></div> {#inert}

Is a `boolean` indicating whether the user agent must act as though the given node is absent for the purposes of user interaction events, in-page text searches ("find in page"), and text selection.

#### **Type**: `Promise<boolean>`

### elem.innerText <div class="specs"><i>W3C</i></div> {#innerText}

Represents the "rendered" text content of a node and its descendants. As a getter, it approximates the text the user would get if they highlighted the contents of the element with the cursor and then copied it to the clipboard.

#### **Type**: `Promise<string>`

### elem.lang <div class="specs"><i>W3C</i></div> {#lang}

Is a `string` representing the language of an element's attributes, text, and element contents.

#### **Type**: `Promise<string>`

### elem.offsetHeight <div class="specs"><i>W3C</i></div> {#offsetHeight}

Returns a <code>double</code> containing the height of an element, relative to the layout.

#### **Type**: `Promise<number>`

### elem.offsetLeft <div class="specs"><i>W3C</i></div> {#offsetLeft}

Returns a <code>double</code>, the distance from this element's left border to its <code>offsetParent</code>'s left border.

#### **Type**: `Promise<number>`

### elem.offsetParent <div class="specs"><i>W3C</i></div> {#offsetParent}

Returns a <code>Element</code> that is the element from which all offset calculations are currently computed.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### elem.offsetTop <div class="specs"><i>W3C</i></div> {#offsetTop}

Returns a <code>double</code>, the distance from this element's top border to its <code>offsetParent</code>'s top border.

#### **Type**: `Promise<number>`

### elem.offsetWidth <div class="specs"><i>W3C</i></div> {#offsetWidth}

Returns a <code>double</code> containing the width of an element, relative to the layout.

#### **Type**: `Promise<number>`

### elem.spellcheck <div class="specs"><i>W3C</i></div> {#spellcheck}

Is a `boolean` that controls spell-checking. It is present on all HTML elements, though it doesn't have an effect on all of them.

#### **Type**: `Promise<boolean>`

### elem.title <div class="specs"><i>W3C</i></div> {#title}

Is a `string` containing the text that appears in a popup box when mouse is over the element.

#### **Type**: `Promise<string>`

### elem.translate <div class="specs"><i>W3C</i></div> {#translate}

Is a `boolean` representing the translation.

#### **Type**: `Promise<boolean>`

### elem.attributes <div class="specs"><i>W3C</i></div> {#attributes}

Returns a <code>NamedNodeMap</code> object containing the assigned attributes of the corresponding HTML element.

#### **Type**: [`NamedNodeMap`](/docs/awaited-dom/named-node-map)

### elem.classList <div class="specs"><i>W3C</i></div> {#classList}

Returns a <code>DOMTokenList</code> containing the list of class attributes.

#### **Type**: [`DOMTokenList`](/docs/awaited-dom/dom-token-list)

### elem.className <div class="specs"><i>W3C</i></div> {#className}

Is a `string` representing the class of the element.

#### **Type**: `Promise<string>`

### elem.clientHeight <div class="specs"><i>W3C</i></div> {#clientHeight}

Returns a `number` representing the inner height of the element.

#### **Type**: `Promise<number>`

### elem.clientLeft <div class="specs"><i>W3C</i></div> {#clientLeft}

Returns a `number` representing the width of the left border of the element.

#### **Type**: `Promise<number>`

### elem.clientTop <div class="specs"><i>W3C</i></div> {#clientTop}

Returns a `number` representing the width of the top border of the element.

#### **Type**: `Promise<number>`

### elem.clientWidth <div class="specs"><i>W3C</i></div> {#clientWidth}

Returns a `number` representing the inner width of the element.

#### **Type**: `Promise<number>`

### elem.id <div class="specs"><i>W3C</i></div> {#id}

Is a `string` representing the id of the element.

#### **Type**: `Promise<string>`

### elem.innerHTML <div class="specs"><i>W3C</i></div> {#innerHTML}

Is a `string` representing the markup of the element's content.

#### **Type**: `Promise<string>`

### elem.localName <div class="specs"><i>W3C</i></div> {#localName}

A `string` representing the local part of the qualified name of the element.

#### **Type**: `Promise<string>`

### elem.namespaceURI <div class="specs"><i>W3C</i></div> {#namespaceURI}

The namespace URI of the element, or <code>null</code> if it is no namespace.
 <div class="note">
 <p><strong>Note:</strong> In Firefox 3.5 and earlier, HTML elements are in no namespace. In later versions, HTML elements are in the <code><a class="external linkification-ext" href="http://www.w3.org/1999/xhtml" rel="noopener" title="Linkification: http://www.w3.org/1999/xhtml">http://www.w3.org/1999/xhtml</a></code> namespace in both HTML and XML trees. </p>
 </div>
 

#### **Type**: `Promise<string>`

### elem.outerHTML <div class="specs"><i>W3C</i></div> {#outerHTML}

Is a `string` representing the markup of the element including its content. When used as a setter, replaces the element with nodes parsed from the given string.

#### **Type**: `Promise<string>`

### elem.part <div class="specs"><i>W3C</i></div> {#part}

Represents the part identifier(s) of the element (i.e. set using the <code>part</code> attribute), returned as a <code>DOMTokenList</code>.

#### **Type**: [`DOMTokenList`](/docs/awaited-dom/dom-token-list)

### elem.prefix <div class="specs"><i>W3C</i></div> {#prefix}

A `string` representing the namespace prefix of the element, or <code>null</code> if no prefix is specified.

#### **Type**: `Promise<string>`

### elem.scrollHeight <div class="specs"><i>W3C</i></div> {#scrollHeight}

Returns a `number` representing the scroll view height of an element.

#### **Type**: `Promise<number>`

### elem.scrollLeft <div class="specs"><i>W3C</i></div> {#scrollLeft}

Is a `number` representing the left scroll offset of the element.

#### **Type**: `Promise<number>`

### elem.scrollTop <div class="specs"><i>W3C</i></div> {#scrollTop}

A `number` representing number of pixels the top of the document is scrolled vertically.

#### **Type**: `Promise<number>`

### elem.scrollWidth <div class="specs"><i>W3C</i></div> {#scrollWidth}

Returns a `number` representing the scroll view width of the element.

#### **Type**: `Promise<number>`

### elem.shadowRoot <div class="specs"><i>W3C</i></div> {#shadowRoot}

Returns the open shadow root that is hosted by the element, or null if no open shadow root is present.

#### **Type**: [`ShadowRoot`](/docs/awaited-dom/shadow-root)

### elem.slot <div class="specs"><i>W3C</i></div> {#slot}

Returns the name of the shadow DOM slot the element is inserted in.

#### **Type**: `Promise<string>`

### elem.tagName <div class="specs"><i>W3C</i></div> {#tagName}

Returns a <code>String</code> with the name of the tag for the given element.

#### **Type**: `Promise<string>`

### elem.baseURI <div class="specs"><i>W3C</i></div> {#baseURI}

Returns a `string` representing the base URL of the document containing the <code>Node</code>.

#### **Type**: `Promise<string>`

### elem.childNodes <div class="specs"><i>W3C</i></div> {#childNodes}

Returns a live <code>NodeList</code> containing all the children of this node. <code>NodeList</code> being live means that if the children of the <code>Node</code> change, the <code>NodeList</code> object is automatically updated.

#### **Type**: [`SuperNodeList`](/docs/awaited-dom/super-node-list)

### elem.firstChild <div class="specs"><i>W3C</i></div> {#firstChild}

Returns a <code>Node</code> representing the first direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: [`SuperNode`](/docs/awaited-dom/super-node)

### elem.isConnected <div class="specs"><i>W3C</i></div> {#isConnected}

A boolean indicating whether or not the Node is connected (directly or indirectly) to the context object, e.g. the <code>Document</code> object in the case of the normal DOM, or the <code>ShadowRoot</code> in the case of a shadow DOM.

#### **Type**: `Promise<boolean>`

### elem.lastChild <div class="specs"><i>W3C</i></div> {#lastChild}

Returns a <code>Node</code> representing the last direct child node of the node, or <code>null</code> if the node has no child.

#### **Type**: [`SuperNode`](/docs/awaited-dom/super-node)

### elem.nextSibling <div class="specs"><i>W3C</i></div> {#nextSibling}

Returns a <code>Node</code> representing the next node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: [`SuperNode`](/docs/awaited-dom/super-node)

### elem.nodeName <div class="specs"><i>W3C</i></div> {#nodeName}

Returns a `string` containing the name of the <code>Node</code>. The structure of the name will differ with the node type. E.g. An <code>HTMLElement</code> will contain the name of the corresponding tag, like <code>'audio'</code> for an <code>HTMLAudioElement</code>, a <code>Text</code> node will have the <code>'#text'</code> string, or a <code>Document</code> node will have the <code>'#document'</code> string.

#### **Type**: `Promise<string>`

### elem.nodeType <div class="specs"><i>W3C</i></div> {#nodeType}

Returns an <code>unsigned short</code> representing the type of the node. Possible values are:
	
<code class="language-html">
    <table class="standard-table">
		<thead>
			<tr>
				<th scope="col">Name</th>
				<th scope="col">Value</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><code>ELEMENT_NODE</code></td>
				<td><code>1</code></td>
			</tr>
			<tr>
				<td><code>ATTRIBUTE_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>2</code></td>
			</tr>
			<tr>
				<td><code>TEXT_NODE</code></td>
				<td><code>3</code></td>
			</tr>
			<tr>
				<td><code>CDATA_SECTION_NODE</code></td>
				<td><code>4</code></td>
			</tr>
			<tr>
				<td><code>ENTITY_REFERENCE_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>5</code></td>
			</tr>
			<tr>
				<td><code>ENTITY_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>6</code></td>
			</tr>
			<tr>
				<td><code>PROCESSING_INSTRUCTION_NODE</code></td>
				<td><code>7</code></td>
			</tr>
			<tr>
				<td><code>COMMENT_NODE</code></td>
				<td><code>8</code></td>
			</tr>
			<tr>
				<td><code>DOCUMENT_NODE</code></td>
				<td><code>9</code></td>
			</tr>
			<tr>
				<td><code>DOCUMENT_TYPE_NODE</code></td>
				<td><code>10</code></td>
			</tr>
			<tr>
				<td><code>DOCUMENT_FRAGMENT_NODE</code></td>
				<td><code>11</code></td>
			</tr>
			<tr>
				<td><code>NOTATION_NODE</code>&nbsp;<span class="icon-only-inline" title="This deprecated API should no longer be used, but will probably still work."><i class="icon-thumbs-down-alt"> </i></span></td>
				<td><code>12</code></td>
			</tr>
		</tbody>
	</table>
</code>

	

#### **Type**: `Promise<number>`

### elem.nodeValue <div class="specs"><i>W3C</i></div> {#nodeValue}

Returns / Sets the value of the current node.

#### **Type**: `Promise<string>`

### elem.ownerDocument <div class="specs"><i>W3C</i></div> {#ownerDocument}

Returns the <code>Document</code> that this node belongs to. If the node is itself a document, returns <code>null</code>.

#### **Type**: [`SuperDocument`](/docs/awaited-dom/super-document)

### elem.parentElement <div class="specs"><i>W3C</i></div> {#parentElement}

Returns an <code>Element</code> that is the parent of this node. If the node has no parent, or if that parent is not an <code>Element</code>, this property returns <code>null</code>.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### elem.parentNode <div class="specs"><i>W3C</i></div> {#parentNode}

Returns a <code>Node</code> that is the parent of this node. If there is no such node, like if this node is the top of the tree or if doesn't participate in a tree, this property returns <code>null</code>.

#### **Type**: [`SuperNode`](/docs/awaited-dom/super-node)

### elem.previousSibling <div class="specs"><i>W3C</i></div> {#previousSibling}

Returns a <code>Node</code> representing the previous node in the tree, or <code>null</code> if there isn't such node.

#### **Type**: [`SuperNode`](/docs/awaited-dom/super-node)

### elem.textContent <div class="specs"><i>W3C</i></div> {#textContent}

Returns / Sets the textual content of an element and all its descendants.

#### **Type**: `Promise<string>`

### elem.style <div class="specs"><i>W3C</i></div> {#style}

The <code><strong>style</strong></code> property is used to get as well as set the <em>inline</em> style of an element. When getting, it returns a <code>CSSStyleDeclaration</code> object that contains a list of all styles properties for that element with values assigned for the attributes that are defined in the element's inline <code>style</code> attribute.

#### **Type**: [`CSSStyleDeclaration`](/docs/awaited-dom/css-style-declaration)

### elem.contentEditable <div class="specs"><i>W3C</i></div> {#contentEditable}

Needs content.

#### **Type**: `Promise<string>`

### elem.isContentEditable <div class="specs"><i>W3C</i></div> {#isContentEditable}

Needs content.

#### **Type**: `Promise<boolean>`

### elem.dataset <div class="specs"><i>W3C</i></div> {#dataset}

Needs content.

#### **Type**: `Promise<Record<string, string>>`

### elem.nonce <div class="specs"><i>W3C</i></div> {#nonce}

Needs content.

#### **Type**: `Promise<string>`

### elem.tabIndex <div class="specs"><i>W3C</i></div> {#tabIndex}

Needs content.

#### **Type**: `Promise<number>`

### elem.nextElementSibling <div class="specs"><i>W3C</i></div> {#nextElementSibling}

Returns the <code>Element</code> immediately following this node in its parent's children list, or <code>null</code> if there is no <code>Element</code> in the list following this node.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### elem.previousElementSibling <div class="specs"><i>W3C</i></div> {#previousElementSibling}

Returns the <code>Element</code> immediately prior to this node in its parent's children list, or <code>null</code> if there is no <code>Element</code> in the list prior to this node.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### elem.childElementCount <div class="specs"><i>W3C</i></div> {#childElementCount}

Returns the number of children of this <code>ParentNode</code> which are elements.

#### **Type**: `Promise<number>`

### elem.children <div class="specs"><i>W3C</i></div> {#children}

Returns a live <code>HTMLCollection</code> containing all of the <code>Element</code> objects that are children of this <code>ParentNode</code>, omitting all of its non-element nodes.

#### **Type**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### elem.firstElementChild <div class="specs"><i>W3C</i></div> {#firstElementChild}

Returns the first node which is both a child of this <code>ParentNode</code> <em>and</em> is also an <code>Element</code>, or <code>null</code> if there is none.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### elem.lastElementChild <div class="specs"><i>W3C</i></div> {#lastElementChild}

Returns the last node which is both a child of this <code>ParentNode</code> <em>and</em> is an <code>Element</code>, or <code>null</code> if there is none.

#### **Type**: [`SuperElement`](/docs/awaited-dom/super-element)

### elem.assignedSlot <div class="specs"><i>W3C</i></div> {#assignedSlot}

Returns the <code>&lt;slot&gt;</code> the node is inserted in.

#### **Type**: [`HTMLSlotElement`](/docs/awaited-dom/html-slot-element)

## Methods

### elem.canPlayType*(type)* <div class="specs"><i>W3C</i></div> {#canPlayType}

Given a string specifying a MIME media type (potentially with the&nbsp;<code>codecs</code>&nbsp;parameter included),&nbsp;<code>canPlayType()</code>&nbsp;returns the string&nbsp;<code>probably</code>&nbsp;if the media should be playable,&nbsp;<code>maybe</code>&nbsp;if there's not enough information to determine whether the media will play or not, or an empty string if the media cannot be played.

#### **Arguments**:


 - type `string`. A `string` containing the MIME type of the media.

#### **Returns**: `Promise<CanPlayTypeResult>`

### elem.captureStream*()* <div class="specs"><i>W3C</i></div> {#captureStream}

Returns <code>MediaStream</code>, captures a stream of the media content.

#### **Returns**: [`MediaStream`](/docs/awaited-dom/media-stream)

### elem.load*()* <div class="specs"><i>W3C</i></div> {#load}

Resets the media to the beginning and selects the best available source from the sources provided using the <code>src</code> attribute or the <code>&lt;source&gt;</code> element.

#### **Returns**: `Promise<void>`

### elem.pause*()* <div class="specs"><i>W3C</i></div> {#pause}

Pauses the media playback.

#### **Returns**: `Promise<void>`

### elem.play*()* <div class="specs"><i>W3C</i></div> {#play}

Begins playback of the media.

#### **Returns**: `Promise<void>`

### elem.setSinkId*(sinkId)* <div class="specs"><i>W3C</i></div> {#setSinkId}

Sets the ID of the audio device to use for output and returns a <code>Promise</code>. This only works when the application is authorized to use the specified device.

#### **Arguments**:


 - sinkId `string`. The <code>MediaDeviceInfo.deviceId</code>&nbsp;of the audio output device.

#### **Returns**: `Promise<void>`

### elem.click*()* <div class="specs"><i>W3C</i></div> {#click}

Sends a mouse click event to the element.

#### **Returns**: `Promise<void>`

### elem.closest*(selectors)* <div class="specs"><i>W3C</i></div> {#closest}

Returns the <code>Element</code> which is the closest ancestor of the current element (or the current element itself) which matches the selectors given in parameter.

#### **Arguments**:


 - selectors `string`. <code><var>selectors</var></code> is a `string` containing a selector list.<br>
      ex: <code>p:hover, .toto + q</code>

#### **Returns**: [`SuperElement`](/docs/awaited-dom/super-element)

### elem.getAttribute*(qualifiedName)* <div class="specs"><i>W3C</i></div> {#getAttribute}

Retrieves the value of the named attribute from the current node and returns it as an <code>Object</code>.

#### **Arguments**:


 - qualifiedName `string`. <code><var>attributeName</var></code> is the name of the attribute whose value you want to get.

#### **Returns**: `Promise<string>`

### elem.getAttributeNames*()* <div class="specs"><i>W3C</i></div> {#getAttributeNames}

Returns an array of attribute names from the current element.

#### **Returns**: `Promise<Iterable,string>`

### elem.getAttributeNode*(qualifiedName)* <div class="specs"><i>W3C</i></div> {#getAttributeNode}

Retrieves the node representation of the named attribute from the current node and returns it as an <code>Attr</code>.

#### **Arguments**:


 - qualifiedName `string`. <code>attrName</code> is a string containing the name of the attribute.

#### **Returns**: `Promise<Attr>`

### elem.getAttributeNodeNS*(namespace, localName)* <div class="specs"><i>W3C</i></div> {#getAttributeNodeNS}

Retrieves the node representation of the attribute with the specified name and namespace, from the current node and returns it as an <code>Attr</code>.

#### **Arguments**:


 - namespace `string`. <code>namespace</code> is a string specifying the namespace of the attribute.
 - localName `string`. <code>nodeName</code> is a string specifying the name of the attribute.

#### **Returns**: `Promise<Attr>`

### elem.getAttributeNS*(namespace, localName)* <div class="specs"><i>W3C</i></div> {#getAttributeNS}

Retrieves the value of the attribute with the specified name and namespace, from the current node and returns it as an <code>Object</code>.

#### **Arguments**:


 - namespace `string`. The namespace in which to look for the specified attribute.
 - localName `string`. The name of the attribute to look for.

#### **Returns**: `Promise<string>`

### elem.getBoundingClientRect*()* <div class="specs"><i>W3C</i></div> {#getBoundingClientRect}

Returns the size of an element and its position relative to the viewport.

#### **Returns**: `Promise<DOMRect>`

### elem.getClientRects*()* <div class="specs"><i>W3C</i></div> {#getClientRects}

Returns a collection of rectangles that indicate the bounding rectangles for each line of text in a client.

#### **Returns**: `Promise<DOMRectList>`

### elem.getElementsByClassName*(classNames)* <div class="specs"><i>W3C</i></div> {#getElementsByClassName}

Returns a live <code>HTMLCollection</code> that contains all descendants of the current element that possess the list of classes given in the parameter.

#### **Arguments**:


 - classNames `string`. A `string` containing one or more class names to match on, separated by whitespace.

#### **Returns**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### elem.getElementsByTagName*(qualifiedName)* <div class="specs"><i>W3C</i></div> {#getElementsByTagName}

Returns a live <code>HTMLCollection</code> containing all descendant elements, of a particular tag name, from the current element.

#### **Arguments**:


 - qualifiedName `string`. <code>tagName</code> is the qualified name to look for. The special string <code>"*"</code> represents all elements. For compatibility with XHTML, lower-case should be used.

#### **Returns**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### elem.getElementsByTagNameNS*(namespace, localName)* <div class="specs"><i>W3C</i></div> {#getElementsByTagNameNS}

Returns a live <code>HTMLCollection</code> containing all descendant elements, of a particular tag name and namespace, from the current element.

#### **Arguments**:


 - namespace `string`. <code>namespaceURI</code> is the namespace URI of elements to look for (see <code>Element.namespaceURI</code> and <code>Attr.namespaceURI</code>). For example, if you need to look for XHTML elements, use the XHTML namespace URI, <span class="nowiki"><code>http://www.w3.org/1999/xhtml</code></span>.
 - localName `string`. <code>localName</code> is either the local name of elements to look for or the special value <code>"*"</code>, which matches all elements (see <code>Element.localName</code> and <code>Attr.localName</code>).

#### **Returns**: [`SuperHTMLCollection`](/docs/awaited-dom/super-html-collection)

### elem.hasAttribute*(qualifiedName)* <div class="specs"><i>W3C</i></div> {#hasAttribute}

Returns a `boolean` indicating if the element has the specified attribute or not.

#### **Arguments**:


 - qualifiedName `string`. is a string representing the name of the attribute.

#### **Returns**: `Promise<boolean>`

### elem.hasAttributeNS*(namespace, localName)* <div class="specs"><i>W3C</i></div> {#hasAttributeNS}

Returns a `boolean` indicating if the element has the specified attribute, in the specified namespace, or not.

#### **Arguments**:


 - namespace `string`. <code>namespace</code> is a string specifying the namespace of the attribute.
 - localName `string`. <code>localName</code> is the name of the attribute.

#### **Returns**: `Promise<boolean>`

### elem.hasAttributes*()* <div class="specs"><i>W3C</i></div> {#hasAttributes}

Returns a `boolean` indicating if the element has one or more HTML attributes present.

#### **Returns**: `Promise<boolean>`

### elem.hasPointerCapture*(pointerId)* <div class="specs"><i>W3C</i></div> {#hasPointerCapture}

Indicates whether the element on which it is invoked has pointer capture for the pointer identified by the given pointer ID.

#### **Arguments**:


 - pointerId `number`. The <code>pointerId</code> of a <code>PointerEvent</code> object.

#### **Returns**: `Promise<boolean>`

### elem.matches*(selectors)* <div class="specs"><i>W3C</i></div> {#matches}

Returns a `boolean` indicating whether or not the element would be selected by the specified selector string.

#### **Arguments**:


 - selectors `string`. <code><var>selectorString</var></code> is a string representing the selector to test.

#### **Returns**: `Promise<boolean>`

### elem.requestFullscreen*(options?)* <div class="specs"><i>W3C</i></div> {#requestFullscreen}

Asynchronously asks the browser to make the element full-screen.

#### **Arguments**:


 - options `FullscreenOptions`. A <code>FullscreenOptions</code> object&nbsp; providing options that control the behavior of the transition to full-screen mode. Currently, the only option is <code>navigationUI</code>, which controls whether or not to show navigation UI while the element is in full-screen mode. The default value is <code>"auto"</code>, which indicates that the browser should decide what to do.

#### **Returns**: `Promise<void>`

### elem.requestPointerLock*()* <div class="specs"><i>W3C</i></div> {#requestPointerLock}

Allows to asynchronously ask for the pointer to be locked on the given element.

#### **Returns**: `Promise<void>`

### elem.scrollIntoView*(arg?)* <div class="specs"><i>W3C</i></div> {#scrollIntoView}

Scrolls the page until the element gets into the view.

#### **Arguments**:


 - arg `boolean | ScrollIntoViewOptions`
     - Is a `boolean` value:
         <ul>
          <li>If <code>true</code>, the top of the element will be aligned to the top of the visible area of the scrollable ancestor. Corresponds to <code>scrollIntoViewOptions: {block: "start", inline: "nearest"}</code>. This is the default value.</li>
          <li>If <code>false</code>, the bottom of the element will be aligned to the bottom of the visible area of the scrollable ancestor. Corresponds to <code>scrollIntoViewOptions: {block: "end", inline: "nearest"}</code>.</li>
         </ul>
     - Is an Object with the following properties:
         <dl>
          <dt><code>behavior</code> <span class="inlineIndicator optional optionalInline">Optional</span></dt>
          <dd>Defines the transition animation.<br>
          One of <code>auto</code> or <code>smooth</code>. Defaults to <code>auto</code>.</dd>
          <dt><code>block</code> <span class="inlineIndicator optional optionalInline">Optional</span></dt>
          <dd>Defines vertical alignment.<br>
          One of <code>start</code>, <code>center</code>, <code>end</code>, or <code>nearest</code>. Defaults to <code>start</code>.</dd>
          <dt><code>inline</code> <span class="inlineIndicator optional optionalInline">Optional</span></dt>
          <dd>Defines horizontal alignment.<br>
          One of <code>start</code>, <code>center</code>, <code>end</code>, or <code>nearest</code>. Defaults to <code>nearest</code>.</dd>
         </dl>
    

#### **Returns**: `Promise<void>`

### elem.compareDocumentPosition*(other)* <div class="specs"><i>W3C</i></div> {#compareDocumentPosition}

Compares the position of the current node against another node in any other document.

#### **Arguments**:


 - other [`Node`](/docs/awaited-dom/node). The other <code>Node</code> with which to compare the first *<code>node</code>*’s document position.

#### **Returns**: `Promise<number>`

### elem.contains*(other)* <div class="specs"><i>W3C</i></div> {#contains}

Returns a `boolean` value indicating whether or not a node is a descendant of the calling node.

#### **Arguments**:


 - other [`Node`](/docs/awaited-dom/node). Needs content.

#### **Returns**: `Promise<boolean>`

### elem.getRootNode*(options?)* <div class="specs"><i>W3C</i></div> {#getRootNode}

Returns the context object's root which optionally includes the shadow root if it is available.&nbsp;

#### **Arguments**:


 - options `GetRootNodeOptions`. An object that sets options for getting the root node. The available options are:
     <ul>
      <li><code>composed</code>: A `boolean` that indicates whether the shadow root should be returned (<code>false</code>, the default), or a root node beyond shadow root (<code>true</code>).</li>
     </ul>

#### **Returns**: [`SuperNode`](/docs/awaited-dom/super-node)

### elem.hasChildNodes*()* <div class="specs"><i>W3C</i></div> {#hasChildNodes}

Returns a `boolean` indicating whether or not the element has any child nodes.

#### **Returns**: `Promise<boolean>`

### elem.isDefaultNamespace*(namespace)* <div class="specs"><i>W3C</i></div> {#isDefaultNamespace}

Accepts a namespace URI as an argument and returns a&nbsp;`boolean`&nbsp;with a value of&nbsp;<code>true</code>&nbsp;if the namespace is the default namespace on the given node or&nbsp;<code>false</code>&nbsp;if not.

#### **Arguments**:


 - namespace `string`. <code>namespaceURI</code> is a string representing the namespace against which the element will be checked.

#### **Returns**: `Promise<boolean>`

### elem.isEqualNode*(otherNode)* <div class="specs"><i>W3C</i></div> {#isEqualNode}

Returns a `boolean` which indicates whether or not two nodes are of the same type and all their defining data points match.

#### **Arguments**:


 - otherNode [`Node`](/docs/awaited-dom/node). <code>otherNode</code>: The <code>Node</code> to compare equality with.

#### **Returns**: `Promise<boolean>`

### elem.isSameNode*(otherNode)* <div class="specs"><i>W3C</i></div> {#isSameNode}

Returns a `boolean` value indicating whether or not the two nodes are the same (that is, they reference the same object).

#### **Arguments**:


 - otherNode [`Node`](/docs/awaited-dom/node). <code><var>otherNode</var></code>&nbsp;The <code>Node</code> to test against.

#### **Returns**: `Promise<boolean>`

### elem.lookupNamespaceURI*(prefix)* <div class="specs"><i>W3C</i></div> {#lookupNamespaceURI}

Accepts a prefix and returns the namespace URI associated with it on the given node if found (and&nbsp;<code>null</code>&nbsp;if not). Supplying&nbsp;<code>null</code>&nbsp;for the prefix will return the default namespace.

#### **Arguments**:


 - prefix `string`. The prefix to look for. If this parameter is <code>null</code>, the method will return the default namespace URI, if any.

#### **Returns**: `Promise<string>`

### elem.lookupPrefix*(namespace)* <div class="specs"><i>W3C</i></div> {#lookupPrefix}

Returns a&nbsp;`string` containing the prefix for a given namespace URI, if present, and&nbsp;<code>null</code>&nbsp;if not. When multiple prefixes are possible, the result is implementation-dependent.

#### **Arguments**:


 - namespace `string`. Needs content.

#### **Returns**: `Promise<string>`

### elem.normalize*()* <div class="specs"><i>W3C</i></div> {#normalize}

Clean up all the text nodes under this element (merge adjacent, remove empty).

#### **Returns**: `Promise<void>`

### elem.blur*()* <div class="specs"><i>W3C</i></div> {#blur}

Needs content.

#### **Returns**: `Promise<void>`

### elem.focus*()* <div class="specs"><i>W3C</i></div> {#focus}

Needs content.

#### **Returns**: `Promise<void>`

### elem.querySelector*(selectors)* <div class="specs"><i>W3C</i></div> {#querySelector}

Returns the first <code>Element</code> with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - selectors `string`. A `string` containing one or more selectors to match against. This string must be a valid compound selector list supported by the browser; if it's not, a <code>SyntaxError</code> exception is thrown. See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors" target="mdnrel">Locating DOM elements using selectors</a> for more information about using selectors to identify elements. Multiple selectors may be specified by separating them using commas.

#### **Returns**: [`SuperElement`](/docs/awaited-dom/super-element)

### elem.querySelectorAll*(selectors)* <div class="specs"><i>W3C</i></div> {#querySelectorAll}

Returns a <code>NodeList</code> representing a list of elements with the current element as root that matches the specified group of selectors.

#### **Arguments**:


 - selectors `string`. A `string` containing one or more selectors to match against. This string must be a valid CSS selector string; if it's not, a <code>SyntaxError</code> exception is thrown. See <a href="https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors" target="mdnrel">Locating DOM elements using selectors</a> for more information about using selectors to identify elements. Multiple selectors may be specified by separating them using commas.

#### **Returns**: [`SuperNodeList`](/docs/awaited-dom/super-node-list)

## Unimplemented Specs

#### Properties

|     |     |
| --- | --- |
| `onencrypted` | `onwaitingforkey` |
| `paused` | `onfullscreenchange` |
| `onfullscreenerror` | `oncopy` |
| `oncut` | `onpaste` |
| `onabort` | `onanimationend` |
| `onanimationiteration` | `onanimationstart` |
| `onauxclick` | `onblur` |
| `oncancel` | `oncanplay` |
| `oncanplaythrough` | `onchange` |
| `onclick` | `onclose` |
| `oncontextmenu` | `oncuechange` |
| `ondblclick` | `ondrag` |
| `ondragend` | `ondragenter` |
| `ondragleave` | `ondragover` |
| `ondragstart` | `ondrop` |
| `ondurationchange` | `onemptied` |
| `onended` | `onerror` |
| `onfocus` | `onformdata` |
| `ongotpointercapture` | `oninput` |
| `oninvalid` | `onkeydown` |
| `onkeypress` | `onkeyup` |
| `onload` | `onloadeddata` |
| `onloadedmetadata` | `onloadstart` |
| `onlostpointercapture` | `onmousedown` |
| `onmouseenter` | `onmouseleave` |
| `onmousemove` | `onmouseout` |
| `onmouseover` | `onmouseup` |
| `onpause` | `onplay` |
| `onplaying` | `onpointercancel` |
| `onpointerdown` | `onpointerenter` |
| `onpointerleave` | `onpointermove` |
| `onpointerout` | `onpointerover` |
| `onpointerup` | `onprogress` |
| `onratechange` | `onreset` |
| `onresize` | `onscroll` |
| `onseeked` | `onseeking` |
| `onselect` | `onselectionchange` |
| `onselectstart` | `onstalled` |
| `onsubmit` | `onsuspend` |
| `ontimeupdate` | `ontouchcancel` |
| `ontouchend` | `ontouchmove` |
| `ontouchstart` | `ontransitionend` |
| `onvolumechange` | `onwaiting` |
| `onwheel` |  |

#### Methods

|     |     |
| --- | --- |
| `addTextTrack()` | `setMediaKeys()` |
| `attachShadow()` | `computedStyleMap()` |
| `insertAdjacentElement()` | `insertAdjacentHTML()` |
| `insertAdjacentText()` | `releasePointerCapture()` |
| `removeAttribute()` | `removeAttributeNode()` |
| `removeAttributeNS()` | `scroll()` |
| `scrollBy()` | `scrollTo()` |
| `setAttribute()` | `setAttributeNode()` |
| `setAttributeNodeNS()` | `setAttributeNS()` |
| `setPointerCapture()` | `toggleAttribute()` |
| `appendChild()` | `cloneNode()` |
| `insertBefore()` | `removeChild()` |
| `replaceChild()` | `addEventListener()` |
| `dispatchEvent()` | `removeEventListener()` |
| `animate()` | `getAnimations()` |
| `after()` | `before()` |
| `remove()` | `replaceWith()` |
| `append()` | `prepend()` |
