# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> TextTrackCue

<div class='overview'><span class="seoSummary"><code><strong>TextTrackCue</strong></code> is an abstract class which is used as the basis for the various derived cue types, such as <code>VTTCue</code>; you will instead work with those derived types.</span> These cues represent a string of text that is presented for some duration of time during the performance of a <code>TextTrack</code>. The cue includes the start time (the time at which the text will be displayed) and the end time (the time at which it will be removed from the display), as well as other information.</div>

## Properties

### .endTime <div class="specs"><i>W3C</i></div> {#endTime}

A <code>double</code> that represents the video time that the cue will stop being displayed, in seconds.

#### **Type**: `Promise<number>`

### .id <div class="specs"><i>W3C</i></div> {#id}

A `string` that identifies the cue.

#### **Type**: `Promise<string>`

### .pauseOnExit <div class="specs"><i>W3C</i></div> {#pauseOnExit}

A <code>boolean</code> for whether the video will pause when this cue stops being displayed.

#### **Type**: `Promise<boolean>`

### .startTime <div class="specs"><i>W3C</i></div> {#startTime}

A <code>double</code> that represents the video time that the cue will start being displayed, in seconds.

#### **Type**: `Promise<number>`

### .track <div class="specs"><i>W3C</i></div> {#track}

The <code>TextTrack</code> that this cue belongs to, or <code>null</code> if it doesn't belong to any.

#### **Type**: [`TextTrack`](/docs/awaited-dom/text-track)

## Unimplemented Specs

#### Properties

|     |     |
| --- | --- |
| `onenter` | `onexit` |

#### Methods

|     |     |
| --- | --- |
| `addEventListener()` | `dispatchEvent()` |
| `removeEventListener()` |  |
