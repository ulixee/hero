# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLMediaElement

<div class='overview'><span class="seoSummary">The <strong><code>HTMLMediaElement</code></strong> interface adds to <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> the properties and methods needed to support basic media-related capabilities that are common to audio and video.</span> The <a href="/en-US/docs/Web/API/HTMLVideoElement" title="The HTMLVideoElement interface provides special properties and methods for manipulating video objects. It also inherits properties and methods of HTMLMediaElement and HTMLElement."><code>HTMLVideoElement</code></a> and <a href="/en-US/docs/Web/API/HTMLAudioElement" title="The HTMLAudioElement interface provides access to the properties of <audio> elements, as well as methods to manipulate them."><code>HTMLAudioElement</code></a> elements both inherit this interface.</div>

## Properties

### .audioTracks <div class="specs"><i>W3C</i></div> {#audioTracks}

A <a href="/en-US/docs/Web/API/AudioTrackList" title="The AudioTrackList interface is used to represent a list of the audio tracks contained within a given HTML media element, with each track represented by a separate AudioTrack object in the list."><code>AudioTrackList</code></a> that lists the <a href="/en-US/docs/Web/API/AudioTrack" title="The AudioTrack interface represents a single audio track from one of the HTML media elements, <audio> or <video>. "><code>AudioTrack</code>
</a> objects contained in the element.

#### **Type**: `null`

### .autoplay <div class="specs"><i>W3C</i></div> {#autoplay}


 <p>A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-autoplay">autoplay</a></code> HTML attribute, indicating whether playback should automatically begin as soon as enough media is available to do so without interruption.</p>
 <div class="note"><strong>Note</strong>: Automatically playing audio when the user doesn't expect or desire it is a poor user experience and should be avoided in most cases, though there are exceptions. See the <a href="/en-US/docs/Web/Media/Autoplay_guide">Autoplay guide for media and Web Audio APIs</a> for more information. Keep in mind that browsers may ignore autoplay requests, so you should ensure that your code isn't dependent on autoplay working.</div>
 

#### **Type**: `null`

### .buffered <div class="specs"><i>W3C</i></div> {#buffered}

Returns a <a href="/en-US/docs/Web/API/TimeRanges" title="The TimeRanges interface is used to represent a set of time ranges, primarily for the purpose of tracking which portions of media have been buffered when loading it for use by the <audio> and <video>&nbsp;elements."><code>TimeRanges</code></a> object that indicates the ranges of the media source that the browser has buffered (if any) at the moment the <code>buffered
</code> property is accessed.

#### **Type**: `null`

### .controls <div class="specs"><i>W3C</i></div> {#controls}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-controls">controls</a>
</code> HTML attribute, indicating whether user interface items for controlling the resource should be displayed.

#### **Type**: `null`

### .controlsList <div class="specs"><i>W3C</i></div> {#controlsList}

Returns a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code></a> that helps the user agent select what controls to show on the media element whenever the user agent shows its own set of controls. The <code>DOMTokenList</code> takes one or more of three possible values: <code>nodownload</code>, <code>nofullscreen</code>, and <code>noremoteplayback
</code>.

#### **Type**: `null`

### .crossOrigin <div class="specs"><i>W3C</i></div> {#crossOrigin}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> indicating the <a href="/en-US/docs/Web/HTML/CORS_settings_attributes">CORS setting
</a> for this media element.

#### **Type**: `null`

### .currentSrc <div class="specs"><i>W3C</i></div> {#currentSrc}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> with the absolute URL of the chosen media resource.

#### **Type**: `null`

### .currentTime <div class="specs"><i>W3C</i></div> {#currentTime}

A double-precision floating-point value indicating the current playback time in seconds; if the media has not started to play and has not been seeked, this value is the media's initial playback time. Setting this value seeks the media to the new time. The time is specified relative to the media's timeline.

#### **Type**: `null`

### .defaultMuted <div class="specs"><i>W3C</i></div> {#defaultMuted}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-muted">muted</a>
</code> HTML attribute, which indicates whether the media element's audio output should be muted by default.

#### **Type**: `null`

### .defaultPlaybackRate <div class="specs"><i>W3C</i></div> {#defaultPlaybackRate}

A <code>double
</code> indicating the default playback rate for the media.

#### **Type**: `null`

### .disableRemotePlayback <div class="specs"><i>W3C</i></div> {#disableRemotePlayback}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> that sets or returns the remote playback state, indicating whether the media element is allowed to have a remote playback UI.

#### **Type**: `null`

### .duration <div class="specs"><i>W3C</i></div> {#duration}

A read-only double-precision floating-point value indicating the total duration of the media in seconds. If no media data is available, the returned value is <code>NaN</code>. If the media is of indefinite length (such as streamed live media, a WebRTC call's media, or similar), the value is <code>+Infinity
</code>.

#### **Type**: `null`

### .ended <div class="specs"><i>W3C</i></div> {#ended}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> that indicates whether the media element has finished playing.

#### **Type**: `null`

### .error <div class="specs"><i>W3C</i></div> {#error}

Returns a <a href="/en-US/docs/Web/API/MediaError" title="The MediaError interface represents an error which occurred while handling media in an HTML media element based on HTMLMediaElement, such as <audio> or <video>."><code>MediaError</code></a> object for the most recent error, or <code>null
</code> if there has not been an error.

#### **Type**: `null`

### .loop <div class="specs"><i>W3C</i></div> {#loop}

A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-loop">loop</a>
</code> HTML attribute, which indicates whether the media element should start over when it reaches the end.

#### **Type**: `null`

### .mediaKeys <div class="specs"><i>W3C</i></div> {#mediaKeys}

Returns a <a href="/en-US/docs/Web/API/MediaKeys" title="The MediaKeys interface of EncryptedMediaExtensions API represents a set of keys that an associated HTMLMediaElement can use for decryption of media data during playback."><code>MediaKeys</code></a> object or <code>null
</code>. MediaKeys is a set of keys that an associated HTMLMediaElement can use for decryption of media data during playback.

#### **Type**: `null`

### .muted <div class="specs"><i>W3C</i></div> {#muted}

Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that determines whether audio is muted. <code>true</code> if the audio is muted and <code>false
</code> otherwise.

#### **Type**: `null`

### .networkState <div class="specs"><i>W3C</i></div> {#networkState}

Returns a <code>unsigned short
</code> (enumeration) indicating the current state of fetching the media over the network.

#### **Type**: `null`

### .onencrypted <div class="specs"><i>W3C</i></div> {#onencrypted}

Sets the <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code>
</a> called when the media is encrypted.

#### **Type**: `null`

### .onwaitingforkey <div class="specs"><i>W3C</i></div> {#onwaitingforkey}

Sets the <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code>
</a> called when playback is blocked while waiting for an encryption key.

#### **Type**: `null`

### .paused <div class="specs"><i>W3C</i></div> {#paused}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> that indicates whether the media element is paused.

#### **Type**: `null`

### .playbackRate <div class="specs"><i>W3C</i></div> {#playbackRate}

Is a <code>double
</code> that indicates the rate at which the media is being played back.

#### **Type**: `null`

### .played <div class="specs"><i>W3C</i></div> {#played}

Returns a <a href="/en-US/docs/Web/API/TimeRanges" title="The TimeRanges interface is used to represent a set of time ranges, primarily for the purpose of tracking which portions of media have been buffered when loading it for use by the <audio> and <video>&nbsp;elements."><code>TimeRanges</code>
</a> object that contains the ranges of the media source that the browser has played, if any.

#### **Type**: `null`

### .preload <div class="specs"><i>W3C</i></div> {#preload}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-preload">preload</a></code> HTML attribute, indicating what data should be preloaded, if any. Possible values are: <code>none</code>, <code>metadata</code>, <code>auto
</code>.

#### **Type**: `null`

### .readyState <div class="specs"><i>W3C</i></div> {#readyState}

Returns a <code>unsigned short
</code> (enumeration) indicating the readiness state of the media.

#### **Type**: `null`

### .seekable <div class="specs"><i>W3C</i></div> {#seekable}

Returns a <a href="/en-US/docs/Web/API/TimeRanges" title="The TimeRanges interface is used to represent a set of time ranges, primarily for the purpose of tracking which portions of media have been buffered when loading it for use by the <audio> and <video>&nbsp;elements."><code>TimeRanges</code>
</a> object that contains the time ranges that the user is able to seek to, if any.

#### **Type**: `null`

### .seeking <div class="specs"><i>W3C</i></div> {#seeking}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code>
</a> that indicates whether the media is in the process of seeking to a new position.

#### **Type**: `null`

### .sinkId <div class="specs"><i>W3C</i></div> {#sinkId}

Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that is the unique ID of the audio device delivering output, or an empty string if it is using the user agent default. This ID should be one of the <code>MediaDeviceInfo.deviceid</code> values returned from <a href="/en-US/docs/Web/API/MediaDevices/enumerateDevices" title="The MediaDevices method enumerateDevices() requests a list of the available media input and output devices, such as microphones, cameras, headsets, and so forth."><code>MediaDevices.enumerateDevices()</code></a>, <code>id-multimedia</code>, or <code>id-communications
</code>.

#### **Type**: `null`

### .src <div class="specs"><i>W3C</i></div> {#src}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-src">src</a>
</code> HTML attribute, which contains the URL of a media resource to use.

#### **Type**: `null`

### .textTracks <div class="specs"><i>W3C</i></div> {#textTracks}

Returns the list of <a href="/en-US/docs/Web/API/TextTrack" title="This interface also inherits properties from EventTarget."><code>TextTrack</code>
</a> objects contained in the element.

#### **Type**: `null`

### .videoTracks <div class="specs"><i>W3C</i></div> {#videoTracks}

Returns the list of <a href="/en-US/docs/Web/API/VideoTrack" title="The VideoTrack interface represents a single video track from a <video> element."><code>VideoTrack</code>
</a> objects contained in the element.

#### **Type**: `null`

### .volume <div class="specs"><i>W3C</i></div> {#volume}

Is a <code>double
</code> indicating the audio volume, from 0.0 (silent) to 1.0 (loudest).

#### **Type**: `null`

## Methods

### .addTextTrack*(...args)* <div class="specs"><i>W3C</i></div> {#addTextTrack}

Adds a text track (such as a track for subtitles) to a media element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .canPlayType*(...args)* <div class="specs"><i>W3C</i></div> {#canPlayType}

Given a string specifying a MIME media type (potentially with the&nbsp;<a href="/en-US/docs/Web/Media/Formats/codecs_parameter"><code>codecs</code>&nbsp;parameter</a> included),&nbsp;<code>canPlayType()</code>&nbsp;returns the string&nbsp;<code>probably</code>&nbsp;if the media should be playable,&nbsp;<code>maybe
</code>&nbsp;if there's not enough information to determine whether the media will play or not, or an empty string if the media cannot be played.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .captureStream*(...args)* <div class="specs"><i>W3C</i></div> {#captureStream}

Returns <a href="/en-US/docs/Web/API/MediaStream" title="The MediaStream interface represents a stream of media content. A stream consists of several tracks such as&nbsp;video or audio tracks. Each track is specified as an instance of MediaStreamTrack."><code>MediaStream</code>
</a>, captures a stream of the media content.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .load*(...args)* <div class="specs"><i>W3C</i></div> {#load}

Resets the media to the beginning and selects the best available source from the sources provided using the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-src">src</a></code> attribute or the <a href="/en-US/docs/Web/HTML/Element/source" title="The HTML <source> element specifies multiple media resources for the <picture>, the <audio> element, or the <video> element."><code>&lt;source&gt;</code>
</a> element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .pause*(...args)* <div class="specs"><i>W3C</i></div> {#pause}

Pauses the media playback.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .play*(...args)* <div class="specs"><i>W3C</i></div> {#play}

Begins playback of the media.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setMediaKeys*(...args)* <div class="specs"><i>W3C</i></div> {#setMediaKeys}

Returns <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" title="The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value."><code>Promise</code></a>. Sets the <a href="/en-US/docs/Web/API/MediaKeys" title="The MediaKeys interface of EncryptedMediaExtensions API represents a set of keys that an associated HTMLMediaElement can use for decryption of media data during playback."><code>MediaKeys</code>
</a> keys to use when decrypting media during playback.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setSinkId*(...args)* <div class="specs"><i>W3C</i></div> {#setSinkId}

Sets the ID of the audio device to use for output and returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" title="The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value."><code>Promise</code>
</a>. This only works when the application is authorized to use the specified device.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
