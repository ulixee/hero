# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> VideoTrack

<div class='overview'><span class="seoSummary">The <code>VideoTrack</code> interface represents a single video track from a <code>&lt;video&gt;</code> element.</span> The most common use for accessing a <code>VideoTrack</code> object is to toggle its <code>selected</code> property in order to make it the active video track for its <code>&lt;video&gt;</code> element.</div>

## Properties

### .id <div class="specs"><i>W3C</i></div> {#id}

A `string` which uniquely identifies the track within the media. This ID can be used to locate a specific track within a video track list by calling <code>VideoTrackList.getTrackById()</code>. The ID can also be used as the fragment part of the URL if the media supports seeking by media fragment per the <a class="external" href="https://www.w3.org/TR/media-frags/" rel="noopener">Media Fragments URI specification</a>.

#### **Type**: `Promise<string>`

### .kind <div class="specs"><i>W3C</i></div> {#kind}

A `string` specifying the category into which the track falls. For example, the main video track would have a <code>kind</code> of <code>"main"</code>.

#### **Type**: `Promise<string>`

### .label <div class="specs"><i>W3C</i></div> {#label}

A `string` providing a human-readable label for the track. For example, a track whose <code>kind</code> is <code>"sign"</code> might have a <code>label</code> of <code>"A sign-language interpretation"</code>. This string is empty if no label is provided.

#### **Type**: `Promise<string>`

### .language <div class="specs"><i>W3C</i></div> {#language}

A `string` specifying the video track's primary language, or an empty string if unknown. The language is specified as a BCP 47 (<a class="external" href="https://tools.ietf.org/html/rfc5646" rel="noopener">RFC 5646</a>) language code, such as <code>"en-US"</code> or <code>"pt-BR"</code>.

#### **Type**: `Promise<string>`

### .selected <div class="specs"><i>W3C</i></div> {#selected}

A Boolean value which controls whether or not the video track is active. Only a single video track can be active at any given time, so setting this property to <code>true</code> for one track while another track is active will make that other track inactive.

#### **Type**: `Promise<boolean>`
