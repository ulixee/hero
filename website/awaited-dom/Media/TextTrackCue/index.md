# TextTrackCue

<div class='overview'><span class="seoSummary"><code><strong>TextTrackCue</strong></code> is an abstract class which is used as the basis for the various derived cue types, such as <a href="/en-US/docs/Web/API/VTTCue" title="This interface also inherits properties from TextTrackCue."><code>VTTCue</code></a>; you will instead work with those derived types.</span> These cues represent a string of text that is presented for some duration of time during the performance of a <a href="/en-US/docs/Web/API/TextTrack" title="This interface also inherits properties from EventTarget."><code>TextTrack</code></a>. The cue includes the start time (the time at which the text will be displayed) and the end time (the time at which it will be removed from the display), as well as other information.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">endTime</a>
    <div>A <code>double</code> that represents the video time that the cue will stop being displayed, in seconds.</div>
  </li>
  <li>
    <a href="">id</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that identifies the cue.</div>
  </li>
  <li>
    <a href="">onenter</a>
    <div>The event handler for the <code><a class="new" href="/en-US/docs/Web/Events/enter" rel="nofollow" title="/en-US/docs/Web/Events/enter">enter</a></code> event.</div>
  </li>
  <li>
    <a href="">onexit</a>
    <div>The event handler for the <code><a class="new" href="/en-US/docs/Web/Events/exit" rel="nofollow" title="/en-US/docs/Web/Events/exit">exit</a></code> event.</div>
  </li>
  <li>
    <a href="">pauseOnExit</a>
    <div>A <code>boolean</code> for whether the video will pause when this cue stops being displayed.</div>
  </li>
  <li>
    <a href="">startTime</a>
    <div>A <code>double</code> that represents the video time that the cue will start being displayed, in seconds.</div>
  </li>
  <li>
    <a href="">track</a>
    <div>The <a href="/en-US/docs/Web/API/TextTrack" title="This interface also inherits properties from EventTarget."><code>TextTrack</code></a> that this cue belongs to, or <code>null</code> if it doesn't belong to any.</div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
