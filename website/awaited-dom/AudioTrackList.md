# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> AudioTrackList

<div class='overview'><span class="seoSummary">The <strong><code>AudioTrackList</code></strong> interface is used to represent a list of the audio tracks contained within a given HTML media element, with each track represented by a separate <a href="/en-US/docs/Web/API/AudioTrack" title="The AudioTrack interface represents a single audio track from one of the HTML media elements, <audio> or <video>. "><code>AudioTrack</code></a> object in the list.</span></div>

<div class='overview'>Retrieve an instance of this object with <a href="/en-US/docs/Web/API/HTMLMediaElement/audioTracks" title="The read-only audioTracks property on HTMLMediaElement objects returns an&nbsp;AudioTrackList object listing all of the&nbsp; AudioTrack objects representing the media element's audio tracks."><code>HTMLMediaElement.audioTracks</code></a>.&nbsp;The individual tracks can be accessed using array syntax.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

The number of tracks in the list.

#### **Type**: `null`

### .onaddtrack <div class="specs"><i>W3C</i></div> {#onaddtrack}

An event handler to be called when the <code><a href="/en-US/docs/Web/Events/addtrack" title="/en-US/docs/Web/Events/addtrack">addtrack</a>
</code> event is fired, indicating that a new audio track has been added to the media element.

#### **Type**: `null`

### .onchange <div class="specs"><i>W3C</i></div> {#onchange}

An event handler to be called when the <code><a href="/en-US/docs/Web/Events/change" title="/en-US/docs/Web/Events/change">change</a></code> event occurs. This occurs when one or more tracks have been enabled or disabled by their <a href="/en-US/docs/Web/API/AudioTrack/enabled" title="The AudioTrack property enabled specifies whether or not the described audio track is currently enabled for use. If the track is disabled by setting enabled to false, the track is muted and does not produce audio."><code>enabled</code>
</a> flag being changed.

#### **Type**: `null`

### .onremovetrack <div class="specs"><i>W3C</i></div> {#onremovetrack}

An event handler to call when the <code><a href="/en-US/docs/Web/Events/removetrack" title="/en-US/docs/Web/Events/removetrack">removetrack</a>
</code> event is sent, indicating that an audio track has been removed from the media element.

#### **Type**: `null`

## Methods

### .getTrackById*(...args)* <div class="specs"><i>W3C</i></div> {#getTrackById}

Returns the <a href="/en-US/docs/Web/API/AudioTrack" title="The AudioTrack interface represents a single audio track from one of the HTML media elements, <audio> or <video>. "><code>AudioTrack</code></a> found within the <code>AudioTrackList</code> whose <a href="/en-US/docs/Web/API/AudioTrack/id" title="The id property contains a string which uniquely identifies the track represented by the AudioTrack."><code>id</code></a> matches the specified string. If no match is found, <code>null
</code> is returned.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
