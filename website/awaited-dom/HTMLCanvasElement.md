# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLCanvasElement

<div class='overview'>The <strong><code>HTMLCanvasElement</code></strong> interface provides properties and methods for manipulating the layout and presentation of <a href="/en-US/docs/Web/HTML/Element/canvas" title="Use the HTML <canvas> element with either the canvas scripting API or the WebGL API to draw graphics and animations."><code>&lt;canvas&gt;</code></a> elements. The <code>HTMLCanvasElement</code> interface also inherits the properties and methods of the <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface.</div>

## Properties

### .height <div class="specs"><i>W3C</i></div> {#height}

Is a positive <code>integer</code> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/canvas#attr-height">height</a></code> HTML attribute of the <a href="/en-US/docs/Web/HTML/Element/canvas" title="Use the HTML <canvas> element with either the canvas scripting API or the WebGL API to draw graphics and animations."><code>&lt;canvas&gt;</code></a> element interpreted in CSS pixels. When the attribute is not specified, or if it is set to an invalid value, like a negative, the default value of <code>150
</code> is used.

#### **Type**: `null`

### .width <div class="specs"><i>W3C</i></div> {#width}

Is a positive <code>integer</code> reflecting the <code><a href="/en-US/docs/Web/HTML/Element/canvas#attr-width">width</a></code> HTML attribute of the <a href="/en-US/docs/Web/HTML/Element/canvas" title="Use the HTML <canvas> element with either the canvas scripting API or the WebGL API to draw graphics and animations."><code>&lt;canvas&gt;</code></a> element interpreted in CSS pixels. When the attribute is not specified, or if it is set to an invalid value, like a negative, the default value of <code>300
</code> is used.

#### **Type**: `null`

## Methods

### .captureStream*(...args)* <div class="specs"><i>W3C</i></div> {#captureStream}

Returns a <a href="/en-US/docs/Web/API/CanvasCaptureMediaStream" title="The documentation about this has not yet been written; please consider contributing!"><code>CanvasCaptureMediaStream</code>
</a> that is a real-time video capture of the surface of the canvas.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getContext*(...args)* <div class="specs"><i>W3C</i></div> {#getContext}

Returns a drawing context on the canvas, or null if the context ID is not supported. A drawing context lets you draw on the canvas. Calling getContext with <code>"2d"</code> returns a <a href="/en-US/docs/Web/API/CanvasRenderingContext2D" title="The CanvasRenderingContext2D interface, part of the Canvas API, provides the 2D rendering context for the drawing surface of a <canvas> element. It is used for drawing shapes, text, images, and other objects."><code>CanvasRenderingContext2D</code></a> object, whereas calling it with <code>"webgl"</code> (or <code>"experimental-webgl"</code>) returns a <a href="/en-US/docs/Web/API/WebGLRenderingContext" title="The WebGLRenderingContext interface provides an interface to the OpenGL ES 2.0 graphics rendering context for the drawing surface of an HTML <canvas> element."><code>WebGLRenderingContext</code></a> object. This context is only available on browsers that implement <a href="/en-US/docs/Web/WebGL">WebGL
</a>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .toBlob*(...args)* <div class="specs"><i>W3C</i></div> {#toBlob}

Creates a <a href="/en-US/docs/Web/API/Blob" title="A Blob object represents a file-like object of immutable, raw data; they can be read as text or binary data, or converted into a ReadableStream so its methods can be used for processing the data. Blobs can represent data that isn't necessarily in a JavaScript-native format. The File interface is based on Blob, inheriting blob functionality and expanding it to support files on the user's system."><code>Blob</code>
</a> object representing the image contained in the canvas; this file may be cached on the disk or stored in memory at the discretion of the user agent.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .toDataURL*(...args)* <div class="specs"><i>W3C</i></div> {#toDataURL}

Returns a data-URL containing a representation of the image in the format specified by the <code>type</code> parameter (defaults to <code>png
</code>). The returned image is in a resolution of 96dpi.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .transferControlToOffscreen*(...args)* <div class="specs"><i>W3C</i></div> {#transferControlToOffscreen}

Transfers control to an <a href="/en-US/docs/Web/API/OffscreenCanvas" title="The OffscreenCanvas interface provides a canvas that can be rendered off screen. It is available in both&nbsp;the window and&nbsp;worker contexts."><code>OffscreenCanvas</code>
</a> object, either on the main thread or on a worker.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
