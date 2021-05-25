# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> VideoTrackList

<div class='overview'><span class="seoSummary">The <strong><code>VideoTrackList</code></strong> interface is used to represent a list of the video tracks contained within a <code>&lt;video&gt;</code> element, with each track represented by a separate <code>VideoTrack</code> object in the list.</span></div>

<div class='overview'>Retrieve an instance of this object with <code>HTMLMediaElement.videoTracks</code>. The individual tracks can be accessed using array syntax or functions such as <code>forEach()</code> for example.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

The number of tracks in the list.

#### **Type**: `Promise<number>`

### .selectedIndex <div class="specs"><i>W3C</i></div> {#selectedIndex}

The index of the currently selected track, if any, or <code>−1</code> otherwise.

#### **Type**: `Promise<number>`

## Methods

### .getTrackById*(id)* <div class="specs"><i>W3C</i></div> {#getTrackById}

Returns the <code>VideoTrack</code> found within the <code>VideoTrackList</code> whose <code>id</code> matches the specified string. If no match is found, <code>null</code> is returned.

#### **Arguments**:


 - id `string`. A `string` indicating the ID of the track to locate within the track list.

#### **Returns**: [`VideoTrack`](/docs/awaited-dom/video-track)

## Unimplemented Specs

#### Properties

|     |     |
| --- | --- |
| `onaddtrack` | `onchange`
`onremovetrack` |  |

#### Methods

|     |     |
| --- | --- |
| `addEventListener()` | `dispatchEvent()`
`removeEventListener()` |  |
