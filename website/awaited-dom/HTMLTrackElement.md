# HTMLTrackElement

<div class='overview'><span class="seoSummary">The <strong><code>HTMLTrackElement</code></strong> interface represents an <a class="glossaryLink" href="/en-US/docs/Glossary/HTML" title="HTML: HTML (HyperText Markup Language) is a descriptive language that specifies webpage structure.">HTML</a> <a href="/en-US/docs/Web/HTML/Element/track" title="The HTML <track> element is used as a child of the media elements <audio> and <video>. It lets you specify timed text tracks (or time-based data), for example to automatically handle subtitles. The tracks are formatted in WebVTT format (.vtt files) — Web Video Text Tracks or&nbsp;Timed Text Markup Language (TTML)."><code>&lt;track&gt;</code></a> element within the <a class="glossaryLink" href="/en-US/docs/Glossary/DOM" title="DOM: The DOM (Document Object Model) is an API that represents and interacts with any HTML or XML document. The DOM is a document model loaded in the browser and representing the document as a node tree, where each node represents part of the document (e.g. an element, text string, or comment).">DOM</a>. This element can be used as a child of either <a href="/en-US/docs/Web/HTML/Element/audio" title="The HTML <audio> element is used to embed sound content in documents. It may contain one or more audio sources, represented using the src attribute or the <source> element:&nbsp;the browser will choose the most suitable one. It can also be the destination for streamed media, using a MediaStream."><code>&lt;audio&gt;</code></a> or <a href="/en-US/docs/Web/HTML/Element/video" title="The&nbsp;HTML Video element&nbsp;(<video>) embeds a media player which supports video playback into the document.&nbsp;You can use&nbsp;<video>&nbsp;for audio content as well, but the <audio> element may provide a more appropriate user experience."><code>&lt;video&gt;</code></a> to specify a text track containing information such as closed captions or subtitles.</span></div>

## Properties

### .default <div class="specs"><i>W3C</i></div> {#default}

A <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/track#attr-default">default</a></code>&nbsp; attribute,&nbsp;indicating&nbsp;that the track is to be enabled if the user's preferences do not indicate that another track would be more appropriate.

#### **Type**: `null`

### .kind <div class="specs"><i>W3C</i></div> {#kind}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/track#attr-kind">kind</a></code>&nbsp;HTML attribute,&nbsp;indicating&nbsp;how the text track is meant to be used. Possible values are: <code>subtitles</code>, <code>captions</code>, <code>descriptions</code>, <code>chapters</code>, or <code>metadata</code>.

#### **Type**: `null`

### .label <div class="specs"><i>W3C</i></div> {#label}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the&nbsp;<code><a href="/en-US/docs/Web/HTML/Element/track#attr-label">label</a></code>&nbsp;HTML attribute,&nbsp;indicating&nbsp;a user-readable title for the track.

#### **Type**: `null`

### .readyState <div class="specs"><i>W3C</i></div> {#readyState}

Returns&nbsp; an <code>unsigned short</code> that show the readiness state of the track:
 <table class="standard-table">
  <tbody>
   <tr>
    <td class="header">Constant</td>
    <td class="header">Value</td>
    <td class="header">Description</td>
   </tr>
   <tr>
    <td><code>NONE</code></td>
    <td>0</td>
    <td>Indicates that the text track's cues have not been obtained.</td>
   </tr>
   <tr>
    <td><code>LOADING</code></td>
    <td>1</td>
    <td>Indicates that the text track is loading and there have been no fatal errors encountered so far. Further cues might still be added to the track by the parser.</td>
   </tr>
   <tr>
    <td><code>LOADED</code></td>
    <td>2</td>
    <td>Indicates that the text track has been loaded with no fatal errors.</td>
   </tr>
   <tr>
    <td><code>ERROR</code></td>
    <td>3</td>
    <td>Indicates that the text track was enabled, but when the user agent attempted to obtain it, this failed in some way. Some or all of the cues are likely missing and will not be obtained.</td>
   </tr>
  </tbody>
 </table>
 

#### **Type**: `null`

### .src <div class="specs"><i>W3C</i></div> {#src}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the&nbsp;<code><a href="/en-US/docs/Web/HTML/Element/track#attr-src">src</a></code>&nbsp;HTML attribute, indicating the address of the text track data.

#### **Type**: `null`

### .srclang <div class="specs"><i>W3C</i></div> {#srclang}

Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the&nbsp;<code><a href="/en-US/docs/Web/HTML/Element/track#attr-srclang">srclang</a></code>&nbsp;HTML attribute,&nbsp;indicating the language of the text track data.

#### **Type**: `null`

### .track <div class="specs"><i>W3C</i></div> {#track}

Returns <a href="/en-US/docs/Web/API/TextTrack" title="This interface also inherits properties from EventTarget."><code>TextTrack</code></a> is the track element's text track data.

#### **Type**: `null`

## Methods

## Events
