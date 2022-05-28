# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> AudioTrack

<div class='overview'><span class="seoSummary">The <strong><code>AudioTrack</code></strong> interface represents a single audio track from one of the HTML media elements, <code>&lt;audio&gt;</code> or <code>&lt;video&gt;</code>. </span>The most common use for accessing an <code>AudioTrack</code> object is to toggle its <code>enabled</code> property in order to mute and unmute the track.</div>

## Properties

### .enabled <div class="specs"><i>W3C</i></div> {#enabled}

A Boolean value which controls whether or not the audio track's sound is enabled. Setting this value to <code>false</code> mutes the track's audio.

#### **Type**: `Promise<boolean>`

### .id <div class="specs"><i>W3C</i></div> {#id}

A `string` which uniquely identifies the track within the media. This ID can be used to locate a specific track within an audio track list by calling <code>AudioTrackList.getTrackById()</code>. The ID can also be used as the fragment part of the URL if the media supports seeking by media fragment per the <a class="external" href="https://www.w3.org/TR/media-frags/" rel="noopener">Media Fragments URI specification</a>.

#### **Type**: `Promise<string>`

### .kind <div class="specs"><i>W3C</i></div> {#kind}

A `string` specifying the category into which the track falls. For example, the main audio track would have a <code>kind</code> of <code>"main"</code>.

#### **Type**: `Promise<string>`

### .label <div class="specs"><i>W3C</i></div> {#label}

A `string` providing a human-readable label for the track. For example, an audio commentary track for a movie might have a <code>label</code> of <code>"Commentary with director John Q. Public and actors John Doe and Jane Eod."</code> This string is empty if no label is provided.

#### **Type**: `Promise<string>`

### .language <div class="specs"><i>W3C</i></div> {#language}

A `string` specifying the audio track's primary language, or an empty string if unknown. The language is specified as a BCP 47 (<a class="external" href="https://tools.ietf.org/html/rfc5646" rel="noopener">RFC 5646</a>) language code, such as <code>"en-US"</code> or <code>"pt-BR"</code>.

#### **Type**: `Promise<string>`
