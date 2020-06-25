# TimeRanges

<div class='overview'>The <code>TimeRanges</code> interface is used to represent a set of time ranges, primarily for the purpose of tracking which portions of media have been buffered when loading it for use by the <a href="/en-US/docs/Web/HTML/Element/audio" title="The HTML <audio> element is used to embed sound content in documents. It may contain one or more audio sources, represented using the src attribute or the <source> element:&nbsp;the browser will choose the most suitable one. It can also be the destination for streamed media, using a MediaStream."><code>&lt;audio&gt;</code></a> and <a href="/en-US/docs/Web/HTML/Element/video" title="The&nbsp;HTML Video element&nbsp;(<video>) embeds a media player which supports video playback into the document.&nbsp;You can use&nbsp;<video>&nbsp;for audio content as well, but the <audio> element may provide a more appropriate user experience."><code>&lt;video&gt;</code></a>&nbsp;elements.</div>

<div class='overview'>A <code>TimeRanges</code> object includes one or more ranges of time, each specified by a starting and ending time offset. You reference each time range by using the <code>start()</code> and <code>end()</code> methods, passing the index number of the time range you want to retrieve.</div>

<div class='overview'>The term "<a class="external" href="https://www.w3.org/TR/html52/semantics-embedded-content.html#normalized-timeranges-object" rel="noopener">normalized TimeRanges object</a>" indicates that ranges in such an object are ordered, don't overlap, aren't empty, and don't touch (adjacent ranges are folded into one bigger range).</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">length</a>
    <div>Returns an <code>unsigned long</code> representing the number of time ranges represented by the time range object.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">end()</a>
    <div>Returns the time for the end of the specified range.</div>
  </li>
  <li>
    <a href="">start()</a>
    <div>Returns the time for the start of the range with the specified index.</div>
  </li>
</ul>

## Events
