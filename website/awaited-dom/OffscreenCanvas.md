# OffscreenCanvas

<div class='overview'><strong>This is an <a href="/en-US/docs/MDN/Contribute/Guidelines/Conventions_definitions#Experimental">experimental technology</a></strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

### .height <div class="specs"><i>W3C</i></div> {#height}

The height of the offscreen canvas.

#### **Type**: `SuperDocument`

### .width <div class="specs"><i>W3C</i></div> {#width}

The width of the offscreen canvas.

#### **Type**: `SuperDocument`

## Methods

### .convertToBlob*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#convertToBlob}

Creates a <a href="/en-US/docs/Web/API/Blob" title="A Blob object represents a file-like object of immutable, raw data; they can be read as text or binary data, or converted into a ReadableStream so its methods can be used for processing the data. Blobs can represent data that isn't necessarily in a JavaScript-native format. The File interface is based on Blob, inheriting blob functionality and expanding it to support files on the user's system."><code>Blob</code></a> object representing the image contained in the canvas.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .getContext*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#getContext}

Returns a rendering context for the offscreen canvas.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .transferToImageBitmap*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#transferToImageBitmap}

Creates an <a href="/en-US/docs/Web/API/ImageBitmap" title="The ImageBitmap interface represents a bitmap image which can be drawn to a <canvas> without undue latency. It can be created from a variety of source objects using the createImageBitmap() factory method. ImageBitmap provides an asynchronous and resource efficient pathway to prepare textures for rendering in WebGL."><code>ImageBitmap</code></a> object from the most recently rendered image of the <code>OffscreenCanvas</code>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
