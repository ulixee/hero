# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> AudioTrackList

<div class='overview'><span class="seoSummary">The <strong><code>AudioTrackList</code></strong> interface is used to represent a list of the audio tracks contained within a given HTML media element, with each track represented by a separate <code>AudioTrack</code> object in the list.</span></div>

<div class='overview'>Retrieve an instance of this object with <code>HTMLMediaElement.audioTracks</code>.&nbsp;The individual tracks can be accessed using array syntax.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

The number of tracks in the list.

#### **Type**: `Promise<number>`

## Methods

### .getTrackById*(id)* <div class="specs"><i>W3C</i></div> {#getTrackById}

Returns the <code>AudioTrack</code> found within the <code>AudioTrackList</code> whose <code>id</code> matches the specified string. If no match is found, <code>null</code> is returned.

#### **Arguments**:


 - id `string`. A `string` indicating the ID of the track to locate within the track list.

#### **Returns**: [`AudioTrack`](/docs/awaited-dom/audio-track)

## Unimplemented Specs

#### Properties

|     |     |
| --- | --- |
| `onaddtrack` | `onchange` |
| `onremovetrack` |  |

#### Methods

|     |     |
| --- | --- |
| `addEventListener()` | `dispatchEvent()` |
| `removeEventListener()` |  |
