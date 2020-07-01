# VideoTrack

<div class='overview'><span class="seoSummary">The <a href="/en-US/docs/Web/API/VideoTrack" title="The VideoTrack interface represents a single video track from a <video> element."><code>VideoTrack</code></a> interface represents a single video track from a <a href="/en-US/docs/Web/HTML/Element/video" title="The&nbsp;HTML Video element&nbsp;(<video>) embeds a media player which supports video playback into the document.&nbsp;You can use&nbsp;<video>&nbsp;for audio content as well, but the <audio> element may provide a more appropriate user experience."><code>&lt;video&gt;</code></a> element.</span> The most common use for accessing a <code>VideoTrack</code> object is to toggle its <a href="/en-US/docs/Web/API/VideoTrack/selected" title="The VideoTrack property selected controls whether or not a particular video track is active."><code>selected</code></a> property in order to make it the active video track for its <a href="/en-US/docs/Web/HTML/Element/video" title="The&nbsp;HTML Video element&nbsp;(<video>) embeds a media player which supports video playback into the document.&nbsp;You can use&nbsp;<video>&nbsp;for audio content as well, but the <audio> element may provide a more appropriate user experience."><code>&lt;video&gt;</code></a> element.</div>

## Properties

### .id <div class="specs"><i>W3C</i></div> {#id}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> which uniquely identifies the track within the media. This ID can be used to locate a specific track within a video track list by calling <a href="/en-US/docs/Web/API/VideoTrackList/getTrackById" title="The VideoTrackList method getTrackById() returns the first VideoTrack object from the track list whose id matches the specified string."><code>VideoTrackList.getTrackById()</code></a>. The ID can also be used as the fragment part of the URL if the media supports seeking by media fragment per the <a class="external" href="https://www.w3.org/TR/media-frags/" rel="noopener">Media Fragments URI specification</a>.

#### **Type**: `null`

### .kind <div class="specs"><i>W3C</i></div> {#kind}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> specifying the category into which the track falls. For example, the main video track would have a <code>kind</code> of <code>"main"</code>.

#### **Type**: `null`

### .label <div class="specs"><i>W3C</i></div> {#label}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> providing a human-readable label for the track. For example, a track whose <code>kind</code> is <code>"sign"</code> might have a <code>label</code> of <code>"A sign-language interpretation"</code>. This string is empty if no label is provided.

#### **Type**: `null`

### .language <div class="specs"><i>W3C</i></div> {#language}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> specifying the video track's primary language, or an empty string if unknown. The language is specified as a BCP 47 (<a class="external" href="https://tools.ietf.org/html/rfc5646" rel="noopener">RFC 5646</a>) language code, such as <code>"en-US"</code> or <code>"pt-BR"</code>.

#### **Type**: `null`

### .selected <div class="specs"><i>W3C</i></div> {#selected}

A Boolean value which controls whether or not the video track is active. Only a single video track can be active at any given time, so setting this property to <code>true</code> for one track while another track is active will make that other track inactive.

#### **Type**: `null`

## Methods

## Events
