# TextTrackList

<div class='overview'><span class="seoSummary">The <strong><code>TextTrackList</code></strong> interface is used to represent a list of the text tracks defined by the <a href="/en-US/docs/Web/HTML/Element/track" title="The HTML <track> element is used as a child of the media elements <audio> and <video>. It lets you specify timed text tracks (or time-based data), for example to automatically handle subtitles. The tracks are formatted in WebVTT format (.vtt files) — Web Video Text Tracks or&nbsp;Timed Text Markup Language (TTML)."><code>&lt;track&gt;</code></a> element, with each track represented by a separate <a href="/en-US/docs/Web/API/TextTrack" title="This interface also inherits properties from EventTarget."><code>textTrack</code></a> object in the list.</span></div>

<div class='overview'>Retrieve an instance of this object with <a href="/en-US/docs/Web/API/HTMLMediaElement/textTracks" title="The read-only textTracks property on HTMLMediaElement objects returns a TextTrackList object listing all of the TextTrack objects representing the media element's text tracks"><code>HTMLMediaElement.textTracks</code></a>. The individual tracks can be accessed using array syntax or functions such as <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach" title="The forEach() method executes a provided function once for each array element."><code>forEach()</code></a> for example.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

The number of tracks in the list.

#### **Type**: `SuperDocument`

### .onaddtrack <div class="specs"><i>W3C</i></div> {#onaddtrack}

An event handler to be called when the <code><a href="/en-US/docs/Web/Events/addtrack" title="/en-US/docs/Web/Events/addtrack">addtrack</a></code> event is fired, indicating that a new text track has been added to the media element.

#### **Type**: `SuperDocument`

### .onchange <div class="specs"><i>W3C</i></div> {#onchange}

An event handler to be called when the <code><a href="/en-US/docs/Web/Events/change" title="/en-US/docs/Web/Events/change">change</a></code> event occurs.

#### **Type**: `SuperDocument`

### .onremovetrack <div class="specs"><i>W3C</i></div> {#onremovetrack}

An event handler to call when the <code><a href="/en-US/docs/Web/Events/removetrack" title="/en-US/docs/Web/Events/removetrack">removetrack</a></code> event is sent, indicating that a text track has been removed from the media element.

#### **Type**: `SuperDocument`

## Methods

### .getTrackById*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getTrackById}

Returns the <a href="/en-US/docs/Web/API/TextTrack" title="This interface also inherits properties from EventTarget."><code>TextTrack</code></a> found within the <code>TextTrackList</code> whose <a class="new" href="/en-US/docs/Web/API/TextTrack/id" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>id</code></a> matches the specified string. If no match is found, <code>null</code> is returned.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
