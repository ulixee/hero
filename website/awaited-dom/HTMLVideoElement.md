# HTMLVideoElement

<div class='overview'>The <strong><code>HTMLVideoElement</code></strong> interface provides special properties and methods for manipulating video objects. It also inherits properties and methods of <a href="/en-US/docs/Web/API/HTMLMediaElement" title="The HTMLMediaElement interface adds to HTMLElement the properties and methods needed to support basic media-related capabilities that are common to audio and video."><code>HTMLMediaElement</code></a> and <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a>.</div>

<div class='overview'>The list of <a href="/en-US/docs/HTML/Supported_media_formats">supported media formats</a> varies from one browser to the other. You should either provide your video in a single format that all the relevant browsers supports, or provide multiple video sources in enough different formats that all the browsers you need to support are covered.</div>

## Properties

### .height <div class="specs"><i>W3C</i></div> {#height}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-height">height</a></code> HTML attribute, which specifies the height of the display area, in CSS pixels.

#### **Type**: `SuperDocument`

### .poster <div class="specs"><i>W3C</i></div> {#poster}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-poster">poster</a></code> HTML attribute, which specifies an image to show while no video data is available.

#### **Type**: `SuperDocument`

### .videoHeight <div class="specs"><i>W3C</i></div> {#videoHeight}

Returns an unsigned integer value indicating the intrinsic height of the resource in CSS pixels, or 0 if no media is available yet.

#### **Type**: `SuperDocument`

### .videoWidth <div class="specs"><i>W3C</i></div> {#videoWidth}

Returns an unsigned integer value indicating the intrinsic width of the resource in CSS pixels, or 0 if no media is available yet.

#### **Type**: `SuperDocument`

### .width <div class="specs"><i>W3C</i></div> {#width}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/video#attr-width">width</a></code> HTML attribute, which specifies the width of the display area, in CSS pixels.

#### **Type**: `SuperDocument`

## Methods

### .getVideoPlaybackQuality*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getVideoPlaybackQuality}

Returns a <a href="/en-US/docs/Web/API/VideoPlaybackQuality" title="A VideoPlaybackQuality object is returned by the HTMLVideoElement.getVideoPlaybackQuality() method and contains metrics that can be used to determine the playback quality of a video."><code>VideoPlaybackQuality</code></a> object that contains the current playback metrics. This information includes things like the number of dropped or corrupted frames, as well as the total number of frames.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
