# AudioTrack

<div class='overview'><span class="seoSummary">The <strong><code>AudioTrack</code></strong> interface represents a single audio track from one of the HTML media elements, <a href="/en-US/docs/Web/HTML/Element/audio" title="The HTML <audio> element is used to embed sound content in documents. It may contain one or more audio sources, represented using the src attribute or the <source> element:&nbsp;the browser will choose the most suitable one. It can also be the destination for streamed media, using a MediaStream."><code>&lt;audio&gt;</code></a> or <a href="/en-US/docs/Web/HTML/Element/video" title="The&nbsp;HTML Video element&nbsp;(<video>) embeds a media player which supports video playback into the document.&nbsp;You can use&nbsp;<video>&nbsp;for audio content as well, but the <audio> element may provide a more appropriate user experience."><code>&lt;video&gt;</code></a>. </span>The most common use for accessing an <code>AudioTrack</code> object is to toggle its <a href="/en-US/docs/Web/API/AudioTrack/enabled" title="The AudioTrack property enabled specifies whether or not the described audio track is currently enabled for use. If the track is disabled by setting enabled to false, the track is muted and does not produce audio."><code>enabled</code></a> property in order to mute and unmute the track.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">enabled</a>
    <div>A Boolean value which controls whether or not the audio track's sound is enabled. Setting this value to <code>false</code> mutes the track's audio.</div>
  </li>
  <li>
    <a href="">id</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> which uniquely identifies the track within the media. This ID can be used to locate a specific track within an audio track list by calling <a href="/en-US/docs/Web/API/AudioTrackList/getTrackById" title="The AudioTrackList method getTrackById() returns the first AudioTrack object from the track list whose id matches the specified string."><code>AudioTrackList.getTrackById()</code></a>. The ID can also be used as the fragment part of the URL if the media supports seeking by media fragment per the <a class="external" href="https://www.w3.org/TR/media-frags/" rel="noopener">Media Fragments URI specification</a>.</div>
  </li>
  <li>
    <a href="">kind</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> specifying the category into which the track falls. For example, the main audio track would have a <code>kind</code> of <code>"main"</code>.</div>
  </li>
  <li>
    <a href="">label</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> providing a human-readable label for the track. For example, an audio commentary track for a movie might have a <code>label</code> of <code>"Commentary with director John Q. Public and actors John Doe and Jane Eod."</code> This string is empty if no label is provided.</div>
  </li>
  <li>
    <a href="">language</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> specifying the audio track's primary language, or an empty string if unknown. The language is specified as a BCP 47 (<a class="external" href="https://tools.ietf.org/html/rfc5646" rel="noopener">RFC 5646</a>) language code, such as <code>"en-US"</code> or <code>"pt-BR"</code>.</div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
