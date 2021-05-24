# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> MediaStream

<div class='overview'><span class="seoSummary">The <strong><code>MediaStream</code></strong> interface represents a stream of media content. A stream consists of several <strong>tracks</strong> such as video or audio tracks. Each track is specified as an instance of <code>MediaStreamTrack</code>.</span>You can obtain a MediaStream object either by using the constructor or by calling <code>MediaDevices.getUserMedia()</code>.</div>

<div class='overview'>Some user agents subclass this interface to provide more precise information or functionality, like in <code>CanvasCaptureMediaStream</code>.</div>

## Properties

### .active <div class="specs"><i>W3C</i></div> {#active}

A Boolean value that returns <code>true</code> if the <code>MediaStream</code> is active, or <code>false</code> otherwise.

#### **Type**: `Promise<boolean>`

### .id <div class="specs"><i>W3C</i></div> {#id}

A `string` containing 36 characters denoting a universally unique identifier (UUID) for the object.

#### **Type**: `Promise<string>`

## Methods

### .clone*()* <div class="specs"><i>W3C</i></div> {#clone}

Returns a clone of the <code>MediaStream</code> object. The clone will, however, have a unique value for <code>id</code>.

#### **Returns**: [`MediaStream`](/docs/awaited-dom/media-stream)

## Unimplemented Specs

#### Properties

|     |     |
| --- | --- |
| `onaddtrack` | `onremovetrack` |

#### Methods

|     |     |
| --- | --- |
| `addTrack()` | `getAudioTracks()`
`getTrackById()` | `getTracks()`
`getVideoTracks()` | `removeTrack()`
`addEventListener()` | `dispatchEvent()`
`removeEventListener()` |  |
