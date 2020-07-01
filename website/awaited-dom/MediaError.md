# MediaError

<div class='overview'><span class="seoSummary">The <code><strong>MediaError</strong></code> interface represents an error which occurred while handling media in an HTML media element based on <a href="/en-US/docs/Web/API/HTMLMediaElement" title="The HTMLMediaElement interface adds to HTMLElement the properties and methods needed to support basic media-related capabilities that are common to audio and video."><code>HTMLMediaElement</code></a>, such as <a href="/en-US/docs/Web/HTML/Element/audio" title="The HTML <audio> element is used to embed sound content in documents. It may contain one or more audio sources, represented using the src attribute or the <source> element:&nbsp;the browser will choose the most suitable one. It can also be the destination for streamed media, using a MediaStream."><code>&lt;audio&gt;</code></a> or <a href="/en-US/docs/Web/HTML/Element/video" title="The&nbsp;HTML Video element&nbsp;(<video>) embeds a media player which supports video playback into the document.&nbsp;You can use&nbsp;<video>&nbsp;for audio content as well, but the <audio> element may provide a more appropriate user experience."><code>&lt;video&gt;</code></a>.</span></div>

<div class='overview'>A <code>MediaError</code> object describes the error in general terms using a numeric <code>code</code> categorizing the kind of error, and a <code>message</code>, which provides specific diagnostics about what went wrong.</div>

## Properties

### .code <div class="specs"><i>W3C</i></div> {#code}

A number which represents the general type of error that occurred, as follows: <table class="standard-table">
 <thead>
  <tr>
   <th scope="col">Name</th>
   <th scope="col">Value</th>
   <th scope="col">Description</th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td><code>MEDIA_ERR_ABORTED</code></td>
   <td><code>1</code></td>
   <td>The fetching of the associated resource was aborted by the user's request.</td>
  </tr>
  <tr>
   <td><code>MEDIA_ERR_NETWORK</code></td>
   <td><code>2</code></td>
   <td>Some kind of network error occurred which prevented the media from being successfully fetched, despite having previously been available.</td>
  </tr>
  <tr>
   <td><code>MEDIA_ERR_DECODE</code></td>
   <td><code>3</code></td>
   <td>Despite having previously been determined to be usable, an error occurred while trying to decode the media resource, resulting in an error.</td>
  </tr>
  <tr>
   <td><code>MEDIA_ERR_SRC_NOT_SUPPORTED</code></td>
   <td><code>4</code></td>
   <td>The associated resource or media provider object (such as a <a href="/en-US/docs/Web/API/MediaStream" title="The MediaStream interface represents a stream of media content. A stream consists of several tracks such as&nbsp;video or audio tracks. Each track is specified as an instance of MediaStreamTrack."><code>MediaStream</code></a>) has been found to be unsuitable.</td>
  </tr>
 </tbody>
</table>

#### **Type**: `null`

### .message <div class="specs"><i>W3C</i></div> {#message}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> object containing a human-readable string which provides <em>specific diagnostic information</em> to help the reader understand the error condition which occurred; specifically, it isn't simply a summary of what the error code means, but actual diagnostic information to help in understanding what exactly went wrong. This text and its format is not defined by the specification and will vary from one <a class="glossaryLink" href="/en-US/docs/Glossary/user_agent" title="user agent: A user agent is a computer program representing a person, for example, a browser in a Web context.">user agent</a> to another. If no diagnostics are available, or no explanation can be provided, this value is an empty string (<code>""</code>).

#### **Type**: `null`

## Methods

## Events
