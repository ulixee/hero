# VideoTrackList

<div class='overview'><span class="seoSummary">The <strong><code>VideoTrackList</code></strong> interface is used to represent a list of the video tracks contained within a <a href="/en-US/docs/Web/HTML/Element/video" title="The&nbsp;HTML Video element&nbsp;(<video>) embeds a media player which supports video playback into the document.&nbsp;You can use&nbsp;<video>&nbsp;for audio content as well, but the <audio> element may provide a more appropriate user experience."><code>&lt;video&gt;</code></a> element, with each track represented by a separate <a href="/en-US/docs/Web/API/VideoTrack" title="The VideoTrack interface represents a single video track from a <video> element."><code>VideoTrack</code></a> object in the list.</span></div>

<div class='overview'>Retrieve an instance of this object with <a href="/en-US/docs/Web/API/HTMLMediaElement/videoTracks" title="The read-only videoTracks property on HTMLMediaElement objects returns a VideoTrackList object listing all of the VideoTrack objects representing the media element's video tracks."><code>HTMLMediaElement.videoTracks</code></a>. The individual tracks can be accessed using array syntax or functions such as <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach" title="The forEach() method executes a provided function once for each array element."><code>forEach()</code></a> for example.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

The number of tracks in the list.

#### **Type**: `SuperDocument`

### .onaddtrack <div class="specs"><i>W3C</i></div> {#onaddtrack}

An event handler to be called when the <code><a href="/en-US/docs/Web/Events/addtrack" title="/en-US/docs/Web/Events/addtrack">addtrack</a></code> event is fired, indicating that a new video track has been added to the media element.

#### **Type**: `SuperDocument`

### .onchange <div class="specs"><i>W3C</i></div> {#onchange}

An event handler to be called when the <code><a href="/en-US/docs/Web/Events/change" title="/en-US/docs/Web/Events/change">change</a></code> event occurs —&nbsp;that is, when the value of the <a href="/en-US/docs/Web/API/VideoTrack/selected" title="The VideoTrack property selected controls whether or not a particular video track is active."><code>selected</code></a> property for a track has changed, due to the track being made active or inactive.

#### **Type**: `SuperDocument`

### .onremovetrack <div class="specs"><i>W3C</i></div> {#onremovetrack}

An event handler to call when the <code><a href="/en-US/docs/Web/Events/removetrack" title="/en-US/docs/Web/Events/removetrack">removetrack</a></code> event is sent, indicating that a video track has been removed from the media element.

#### **Type**: `SuperDocument`

### .selectedIndex <div class="specs"><i>W3C</i></div> {#selectedIndex}

The index of the currently selected track, if any, or <code>−1</code> otherwise.

#### **Type**: `SuperDocument`

## Methods

### .getTrackById*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getTrackById}

Returns the <a href="/en-US/docs/Web/API/VideoTrack" title="The VideoTrack interface represents a single video track from a <video> element."><code>VideoTrack</code></a> found within the <code>VideoTrackList</code> whose <a href="/en-US/docs/Web/API/VideoTrack/id" title="The id property contains a string which uniquely identifies the track represented by the VideoTrack."><code>id</code></a> matches the specified string. If no match is found, <code>null</code> is returned.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
