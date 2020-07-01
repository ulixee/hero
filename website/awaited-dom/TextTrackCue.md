# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> TextTrackCue

<div class='overview'><span class="seoSummary"><code><strong>TextTrackCue</strong></code> is an abstract class which is used as the basis for the various derived cue types, such as <a href="/en-US/docs/Web/API/VTTCue" title="This interface also inherits properties from TextTrackCue."><code>VTTCue</code></a>; you will instead work with those derived types.</span> These cues represent a string of text that is presented for some duration of time during the performance of a <a href="/en-US/docs/Web/API/TextTrack" title="This interface also inherits properties from EventTarget."><code>TextTrack</code></a>. The cue includes the start time (the time at which the text will be displayed) and the end time (the time at which it will be removed from the display), as well as other information.</div>

## Properties

### .endTime <div class="specs"><i>W3C</i></div> {#endTime}

A <code>double
</code> that represents the video time that the cue will stop being displayed, in seconds.

#### **Type**: `null`

### .id <div class="specs"><i>W3C</i></div> {#id}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code>
</a> that identifies the cue.

#### **Type**: `null`

### .onenter <div class="specs"><i>W3C</i></div> {#onenter}

The event handler for the <code><a class="new" href="/en-US/docs/Web/Events/enter" rel="nofollow" title="/en-US/docs/Web/Events/enter">enter</a>
</code> event.

#### **Type**: `null`

### .onexit <div class="specs"><i>W3C</i></div> {#onexit}

The event handler for the <code><a class="new" href="/en-US/docs/Web/Events/exit" rel="nofollow" title="/en-US/docs/Web/Events/exit">exit</a>
</code> event.

#### **Type**: `null`

### .pauseOnExit <div class="specs"><i>W3C</i></div> {#pauseOnExit}

A <code>boolean
</code> for whether the video will pause when this cue stops being displayed.

#### **Type**: `null`

### .startTime <div class="specs"><i>W3C</i></div> {#startTime}

A <code>double
</code> that represents the video time that the cue will start being displayed, in seconds.

#### **Type**: `null`

### .track <div class="specs"><i>W3C</i></div> {#track}

The <a href="/en-US/docs/Web/API/TextTrack" title="This interface also inherits properties from EventTarget."><code>TextTrack</code></a> that this cue belongs to, or <code>null
</code> if it doesn't belong to any.

#### **Type**: `null`
