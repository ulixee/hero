# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLImageElement

<div class='overview'><span class="seoSummary">The <strong><code>HTMLImageElement</code></strong> interface represents an HTML <a href="/en-US/docs/Web/HTML/Element/img" title="The HTML <img> element embeds an image into the document."><code>&lt;img&gt;</code></a> element, providing the properties and methods used to manipulate image elements.</span></div>

## Properties

### .alt <div class="specs"><i>W3C</i></div> {#alt}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/img#attr-alt">alt</a>
</code> HTML attribute, thus indicating the alternate fallback content to be displayed if the image has not been loaded.

#### **Type**: `null`

### .complete <div class="specs"><i>W3C</i></div> {#complete}

Returns a <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> that is <code>true</code> if the browser has finished fetching the image, whether successful or not. That means this value is also <code>true</code> if the image has no <a href="/en-US/docs/Web/API/HTMLImageElement/src" title="The HTMLImageElement property src, which reflects the HTML src attribute, specifies the image to display in the <img> element."><code>src</code>
</a> value indicating an image to load.

#### **Type**: `null`

### .crossOrigin <div class="specs"><i>W3C</i></div> {#crossOrigin}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> specifying the CORS setting for this image element. See <a href="/en-US/docs/HTML/CORS_settings_attributes">CORS settings attributes</a> for further details. This may be <code>null
</code> if CORS is not used.

#### **Type**: `null`

### .currentSrc <div class="specs"><i>W3C</i></div> {#currentSrc}

Returns a <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> representing the URL from which the currently displayed image was loaded. This may change as the image is adjusted due to changing conditions, as directed by any <a href="/en-US/docs/Web/CSS/Media_Queries">media queries
</a> which are in place.

#### **Type**: `null`

### .decoding <div class="specs"><i>W3C</i></div> {#decoding}

An optional <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> representing a hint given to the browser on how it should decode the image. If this value is provided, it must be one of the possible permitted values: <code>sync</code> to decode the image synchronously, <code>async</code> to decode it asynchronously, or <code>auto</code> to indicate no preference (which is the default). Read the <a href="/en-US/docs/Web/API/HTMLImageElement/decoding" title="The decoding property of the HTMLImageElement interface represents a hint given to the browser on how it should decode the image."><code>decoding</code>
</a> page for details on the implications of this property's values.

#### **Type**: `null`

### .height <div class="specs"><i>W3C</i></div> {#height}

An integer value that reflects the <code><a href="/en-US/docs/Web/HTML/Element/img#attr-height">height</a>
</code> HTML attribute, indicating the rendered height of the image in CSS pixels.

#### **Type**: `null`

### .isMap <div class="specs"><i>W3C</i></div> {#isMap}

A <a href="/en-US/docs/Web/API/Boolean" title="REDIRECT Boolean [en-US]"><code>Boolean</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/img#attr-ismap">ismap</a></code> HTML attribute, indicating that the image is part of a server-side image map. This is different from a client-side image map, specified using an <code>&lt;img&gt;</code> element and a corresponding <a href="/en-US/docs/Web/HTML/Element/map" title="The HTML <map> element is used with <area> elements to define an image map (a clickable link area)."><code>&lt;map&gt;</code></a> which contains <a href="/en-US/docs/Web/HTML/Element/area" title="The HTML <area> element defines a hot-spot region on an image, and optionally associates it with a hypertext link. This element is used only within a <map> element."><code>&lt;area&gt;</code></a> elements indicating the clickable areas in the image. The image <em>must</em> be contained within an <a href="/en-US/docs/Web/HTML/Element/a" title="The HTML <a> element (or anchor element), with its href attribute, creates a hyperlink to web pages, files, email addresses, locations in the same page, or anything else a URL can address."><code>&lt;a&gt;</code></a> element; see the <code>ismap
</code> page for details.

#### **Type**: `null`

### .naturalHeight <div class="specs"><i>W3C</i></div> {#naturalHeight}

Returns an integer value representing the intrinsic height of the image in CSS pixels, if it is available; else, it shows <code>0
</code>. This is the height the image would be if it were rendered at its natural full size.

#### **Type**: `null`

### .naturalWidth <div class="specs"><i>W3C</i></div> {#naturalWidth}

An integer value representing the intrinsic width of the image in CSS pixels, if it is available; otherwise, it will show <code>0
</code>. This is the width the image would be if it were rendered at its natural full size.

#### **Type**: `null`

### .referrerPolicy <div class="specs"><i>W3C</i></div> {#referrerPolicy}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/img#attr-referrerpolicy">referrerpolicy</a></code> HTML attribute, which tells the <a class="glossaryLink" href="/en-US/docs/Glossary/user_agent" title="user agent: A user agent is a computer program representing a person, for example, a browser in a Web context.">user agent
</a> how to decide which referrer to use in order to fetch the image. Read this article for details on the possible values of this string.

#### **Type**: `null`

### .sizes <div class="specs"><i>W3C</i></div> {#sizes}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/img#attr-sizes">sizes</a></code> HTML attribute. This string specifies a list of comma-separated conditional sizes for the image; that is, for a given viewport size, a particular image size is to be used. Read the documentation on the <a href="/en-US/docs/Web/API/HTMLImageElement/sizes" title="The HTMLImageElement property sizes allows you to specify the layout width of the image for each of a list of media conditions. This provides the ability to automatically select among different images—even images of different orientations or aspect ratios—as the document state changes to match different media conditions."><code>sizes</code>
</a> page for details on the format of this string.

#### **Type**: `null`

### .src <div class="specs"><i>W3C</i></div> {#src}

A <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/img#attr-src">src</a></code> HTML attribute, which contains the full URL of the image including base URI. You can load a different image into the element by changing the URL in the <code>src
</code> attribute.

#### **Type**: `null`

### .srcset <div class="specs"><i>W3C</i></div> {#srcset}

A <a href="/en-US/docs/Web/API/USVString" title="USVString corresponds to the set of all possible sequences of unicode scalar values. USVString maps to a String when returned in JavaScript; it's generally only used for APIs that perform text processing and need a string of unicode scalar values to operate on. USVString is equivalent to DOMString except for not allowing unpaired surrogate codepoints. Unpaired surrogate codepoints present in USVString are converted by the browser to Unicode 'replacement character' U+FFFD, (�)."><code>USVString</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/img#attr-srcset">srcset</a></code> HTML attribute. This specifies a list of candidate images, separated by commas (<code>',', U+002C COMMA</code>). Each candidate image is a URL followed by a space, followed by a specially-formatted string indicating the size of the image. The size may be specified either the width or a size multiple. Read the <a href="/en-US/docs/Web/API/HTMLImageElement/srcset" title="The HTMLImageElement property srcset is a string which identifies one or more image candidate strings, separated using commas (,) each specifying image resources to use under given circumstances."><code>srcset</code>
</a> page for specifics on the format of the size substring.

#### **Type**: `null`

### .useMap <div class="specs"><i>W3C</i></div> {#useMap}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/img#attr-usemap">usemap</a></code> HTML attribute, containing the page-local URL of the <a href="/en-US/docs/Web/HTML/Element/map" title="The HTML <map> element is used with <area> elements to define an image map (a clickable link area)."><code>&lt;map&gt;</code></a> element describing the image map to use. The page-local URL is a pound (hash) symbol (<code>#</code>) followed by the ID of the <code>&lt;map&gt;</code> element, such as <code>#my-map-element</code>. The <code>&lt;map&gt;</code> in turn contains <a href="/en-US/docs/Web/HTML/Element/area" title="The HTML <area> element defines a hot-spot region on an image, and optionally associates it with a hypertext link. This element is used only within a <map> element."><code>&lt;area&gt;</code>
</a> elements indicating the clickable areas in the image.

#### **Type**: `null`

### .width <div class="specs"><i>W3C</i></div> {#width}

An integer value that reflects the <code><a href="/en-US/docs/Web/HTML/Element/img#attr-width">width</a>
</code> HTML attribute, indicating the rendered width of the image in CSS pixels.

#### **Type**: `null`

### .x <div class="specs"><i>W3C</i></div> {#x}

An integer indicating the horizontal offset of the left border edge of the image's CSS layout box relative to the origin of the <a href="/en-US/docs/Web/HTML/Element/html" title="The HTML <html> element represents the root (top-level element) of an HTML document, so it is also referred to as the root element. All other elements must be descendants of this element."><code>&lt;html&gt;</code>
</a> element's containing block.

#### **Type**: `null`

### .y <div class="specs"><i>W3C</i></div> {#y}

The integer vertical offset of the top border edge of the image's CSS layout box relative to the origin of the <a href="/en-US/docs/Web/HTML/Element/html" title="The HTML <html> element represents the root (top-level element) of an HTML document, so it is also referred to as the root element. All other elements must be descendants of this element."><code>&lt;html&gt;</code>
</a> element's containing block.

#### **Type**: `null`

## Methods

### .decode*(...args)* <div class="specs"><i>W3C</i></div> {#decode}

Returns a <a href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" title="The Promise object represents the eventual completion (or failure) of an asynchronous operation, and its resulting value."><code>Promise</code>
</a> that resolves when the image is decoded and it's safe to append the image to the DOM. This prevents rendering of the next frame from having to pause to decode the image, as would happen if an undecoded image were added to the DOM.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
