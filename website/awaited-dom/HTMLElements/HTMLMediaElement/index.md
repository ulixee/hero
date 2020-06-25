# HTMLMediaElement

<div class='overview'><span class="seoSummary">The <strong><code>HTMLMediaElement</code></strong> interface adds to <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> the properties and methods needed to support basic media-related capabilities that are common to audio and video.</span> The <a href="/en-US/docs/Web/API/HTMLVideoElement" title="The HTMLVideoElement interface provides special properties and methods for manipulating video objects. It also inherits properties and methods of HTMLMediaElement and HTMLElement."><code>HTMLVideoElement</code></a> and <a href="/en-US/docs/Web/API/HTMLAudioElement" title="The HTMLAudioElement interface provides access to the properties of <audio> elements, as well as methods to manipulate them."><code>HTMLAudioElement</code></a> elements both inherit this interface.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">audioTracks</a>
    <div>A <a href="/en-US/docs/Web/API/AudioTrackList" title="The AudioTrackList interface is used to represent a list of the audio tracks contained within a given HTML media element, with each track represented by a separate AudioTrack object in the list."><code>AudioTrackList</code></a> that lists the <a href="/en-US/docs/Web/API/AudioTrack" title="The AudioTrack interface represents a single audio track from one of the HTML media elements, <audio> or <video>. "><code>AudioTrack</code></a> objects contained in the element.</div>
  </li>
  <li>
    <a href="">autoplay</a>
    <div>
 <p>A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-autoplay">autoplay</a></code> HTML attribute, indicating whether playback should automatically begin as soon as enough media is available to do so without interruption.</p>
 <div class="note"><strong>Note</strong>: Automatically playing audio when the user doesn't expect or desire it is a poor user experience and should be avoided in most cases, though there are exceptions. See the <a href="/en-US/docs/Web/Media/Autoplay_guide">Autoplay guide for media and Web Audio APIs</a> for more information. Keep in mind that browsers may ignore autoplay requests, so you should ensure that your code isn't dependent on autoplay working.</div>
 </div>
  </li>
  <li>
    <a href="">buffered</a>
    <div>Returns a <a href="/en-US/docs/Web/API/TimeRanges" title="The TimeRanges interface is used to represent a set of time ranges, primarily for the purpose of tracking which portions of media have been buffered when loading it for use by the <audio> and <video>&nbsp;elements."><code>TimeRanges</code></a> object that indicates the ranges of the media source that the browser has buffered (if any) at the moment the <code>buffered</code> property is accessed.</div>
  </li>
  <li>
    <a href="">controls</a>
    <div>Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-controls">controls</a></code> HTML attribute, indicating whether user interface items for controlling the resource should be displayed.</div>
  </li>
  <li>
    <a href="">controlsList</a>
    <div>Returns a <a href="/en-US/docs/Web/API/DOMTokenList" title="The DOMTokenList interface represents a set of space-separated tokens. Such a set is returned by Element.classList, HTMLLinkElement.relList, HTMLAnchorElement.relList, HTMLAreaElement.relList, HTMLIframeElement.sandbox, or HTMLOutputElement.htmlFor. It is indexed beginning with 0 as with JavaScript Array objects. DOMTokenList is always case-sensitive."><code>DOMTokenList</code></a> that helps the user agent select what controls to show on the media element whenever the user agent shows its own set of controls. The <code>DOMTokenList</code> takes one or more of three possible values: <code>nodownload</code>, <code>nofullscreen</code>, and <code>noremoteplayback</code>.</div>
  </li>
  <li>
    <a href="">crossOrigin</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> indicating the <a href="/en-US/docs/Web/HTML/CORS_settings_attributes">CORS setting</a> for this media element.</div>
  </li>
  <li>
    <a href="">currentSrc</a>
    <div>Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> with the absolute URL of the chosen media resource.</div>
  </li>
  <li>
    <a href="">currentTime</a>
    <div>A double-precision floating-point value indicating the current playback time in seconds; if the media has not started to play and has not been seeked, this value is the media's initial playback time. Setting this value seeks the media to the new time. The time is specified relative to the media's timeline.</div>
  </li>
  <li>
    <a href="">defaultMuted</a>
    <div>A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-muted">muted</a></code> HTML attribute, which indicates whether the media element's audio output should be muted by default.</div>
  </li>
  <li>
    <a href="">defaultPlaybackRate</a>
    <div>A <code>double</code> indicating the default playback rate for the media.</div>
  </li>
  <li>
    <a href="">disableRemotePlayback</a>
    <div>A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that sets or returns the remote playback state, indicating whether the media element is allowed to have a remote playback UI.</div>
  </li>
  <li>
    <a href="">duration</a>
    <div>A read-only double-precision floating-point value indicating the total duration of the media in seconds. If no media data is available, the returned value is <code>NaN</code>. If the media is of indefinite length (such as streamed live media, a WebRTC call's media, or similar), the value is <code>+Infinity</code>.</div>
  </li>
  <li>
    <a href="">ended</a>
    <div>Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that indicates whether the media element has finished playing.</div>
  </li>
  <li>
    <a href="">error</a>
    <div>Returns a <a href="/en-US/docs/Web/API/MediaError" title="The MediaError interface represents an error which occurred while handling media in an HTML media element based on HTMLMediaElement, such as <audio> or <video>."><code>MediaError</code></a> object for the most recent error, or <code>null</code> if there has not been an error.</div>
  </li>
  <li>
    <a href="">loop</a>
    <div>A <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-loop">loop</a></code> HTML attribute, which indicates whether the media element should start over when it reaches the end.</div>
  </li>
  <li>
    <a href="">mediaKeys</a>
    <div>Returns a <a href="/en-US/docs/Web/API/MediaKeys" title="The MediaKeys interface of EncryptedMediaExtensions API represents a set of keys that an associated HTMLMediaElement can use for decryption of media data during playback."><code>MediaKeys</code></a> object or <code>null</code>. MediaKeys is a set of keys that an associated HTMLMediaElement can use for decryption of media data during playback.</div>
  </li>
  <li>
    <a href="">muted</a>
    <div>Is a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that determines whether audio is muted. <code>true</code> if the audio is muted and <code>false</code> otherwise.</div>
  </li>
  <li>
    <a href="">networkState</a>
    <div>Returns a <code>unsigned short</code> (enumeration) indicating the current state of fetching the media over the network.</div>
  </li>
  <li>
    <a href="">onencrypted</a>
    <div>Sets the <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when the media is encrypted.</div>
  </li>
  <li>
    <a href="">onwaitingforkey</a>
    <div>Sets the <a href="/en-US/docs/Web/API/EventHandler" title="REDIRECT DOM event handlers"><code>EventHandler</code></a> called when playback is blocked while waiting for an encryption key.</div>
  </li>
  <li>
    <a href="">paused</a>
    <div>Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that indicates whether the media element is paused.</div>
  </li>
  <li>
    <a href="">playbackRate</a>
    <div>Is a <code>double</code> that indicates the rate at which the media is being played back.</div>
  </li>
  <li>
    <a href="">played</a>
    <div>Returns a <a href="/en-US/docs/Web/API/TimeRanges" title="The TimeRanges interface is used to represent a set of time ranges, primarily for the purpose of tracking which portions of media have been buffered when loading it for use by the <audio> and <video>&nbsp;elements."><code>TimeRanges</code></a> object that contains the ranges of the media source that the browser has played, if any.</div>
  </li>
  <li>
    <a href="">preload</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-preload">preload</a></code> HTML attribute, indicating what data should be preloaded, if any. Possible values are: <code>none</code>, <code>metadata</code>, <code>auto</code>.</div>
  </li>
  <li>
    <a href="">readyState</a>
    <div>Returns a <code>unsigned short</code> (enumeration) indicating the readiness state of the media.</div>
  </li>
  <li>
    <a href="">seekable</a>
    <div>Returns a <a href="/en-US/docs/Web/API/TimeRanges" title="The TimeRanges interface is used to represent a set of time ranges, primarily for the purpose of tracking which portions of media have been buffered when loading it for use by the <audio> and <video>&nbsp;elements."><code>TimeRanges</code></a> object that contains the time ranges that the user is able to seek to, if any.</div>
  </li>
  <li>
    <a href="">seeking</a>
    <div>Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean" title="The Boolean object is an object wrapper for a boolean value."><code>Boolean</code></a> that indicates whether the media is in the process of seeking to a new position.</div>
  </li>
  <li>
    <a href="">sinkId</a>
    <div>Returns a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that is the unique ID of the audio device delivering output, or an empty string if it is using the user agent default. This ID should be one of the <code>MediaDeviceInfo.deviceid</code> values returned from <a href="/en-US/docs/Web/API/MediaDevices/enumerateDevices" title="The MediaDevices method enumerateDevices() requests a list of the available media input and output devices, such as microphones, cameras, headsets, and so forth."><code>MediaDevices.enumerateDevices()</code></a>, <code>id-multimedia</code>, or <code>id-communications</code>.</div>
  </li>
  <li>
    <a href="">src</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-src">src</a></code> HTML attribute, which contains the URL of a media resource to use.</div>
  </li>
  <li>
    <a href="">textTracks</a>
    <div>Returns the list of <a href="/en-US/docs/Web/API/TextTrack" title="This interface also inherits properties from EventTarget."><code>TextTrack</code></a> objects contained in the element.</div>
  </li>
  <li>
    <a href="">videoTracks</a>
    <div>Returns the list of <a href="/en-US/docs/Web/API/VideoTrack" title="The VideoTrack interface represents a single video track from a <video> element."><code>VideoTrack</code></a> objects contained in the element.</div>
  </li>
  <li>
    <a href="">volume</a>
    <div>Is a <code>double</code> indicating the audio volume, from 0.0 (silent) to 1.0 (loudest).</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">addTextTrack()</a>
    <div>Adds a text track (such as a track for subtitles) to a media element.</div>
  </li>
  <li>
    <a href="">canPlayType()</a>
    <div>Given a string specifying a MIME media type (potentially with the&nbsp;<a href="/en-US/docs/Web/Media/Formats/codecs_parameter"><code>codecs</code>&nbsp;parameter</a> included),&nbsp;<code>canPlayType()</code>&nbsp;returns the string&nbsp;<code>probably</code>&nbsp;if the media should be playable,&nbsp;<code>maybe</code>&nbsp;if there's not enough information to determine whether the media will play or not, or an empty string if the media cannot be played.</div>
  </li>
  <li>
    <a href="">captureStream()</a>
    <div>Returns <a href="/en-US/docs/Web/API/MediaStream" title="The MediaStream interface represents a stream of media content. A stream consists of several tracks such as&nbsp;video or audio tracks. Each track is specified as an instance of MediaStreamTrack."><code>MediaStream</code></a>, captures a stream of the media content.</div>
  </li>
  <li>
    <a href="">load()</a>
    <div>Resets the media to the beginning and selects the best available source from the sources provided using the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-src">src</a></code> attribute or the <a href="/en-US/docs/Web/HTML/Element/source" title="The HTML <source> element specifies multiple media resources for the <picture>, the <audio> element, or the <video> element."><code>&lt;source&gt;</code></a> element.</div>
  </li>
  <li>
    <a href="">pause()</a>
    <div>Pauses the media playback.</div>
  </li>
  <li>
    <a href="">play()</a>
    <div>Begins playback of the media.</div>
  </li>
  <li>
    <a href="">setMediaKeys()</a>
    <div>Returns <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" title="The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value."><code>Promise</code></a>. Sets the <a href="/en-US/docs/Web/API/MediaKeys" title="The MediaKeys interface of EncryptedMediaExtensions API represents a set of keys that an associated HTMLMediaElement can use for decryption of media data during playback."><code>MediaKeys</code></a> keys to use when decrypting media during playback.</div>
  </li>
  <li>
    <a href="">setSinkId()</a>
    <div>Sets the ID of the audio device to use for output and returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" title="The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value."><code>Promise</code></a>. This only works when the application is authorized to use the specified device.</div>
  </li>
</ul>

## Events
