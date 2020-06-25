# OffscreenCanvas

<div class='overview'><strong>This is an <a href="/en-US/docs/MDN/Contribute/Guidelines/Conventions_definitions#Experimental">experimental technology</a></strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">height</a>
    <div>The height of the offscreen canvas.</div>
  </li>
  <li>
    <a href="">width</a>
    <div>The width of the offscreen canvas.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">convertToBlob()</a>
    <div>Creates a <a href="/en-US/docs/Web/API/Blob" title="A Blob object represents a file-like object of immutable, raw data; they can be read as text or binary data, or converted into a ReadableStream so its methods can be used for processing the data. Blobs can represent data that isn't necessarily in a JavaScript-native format. The File interface is based on Blob, inheriting blob functionality and expanding it to support files on the user's system."><code>Blob</code></a> object representing the image contained in the canvas.</div>
  </li>
  <li>
    <a href="">getContext()</a>
    <div>Returns a rendering context for the offscreen canvas.</div>
  </li>
  <li>
    <a href="">transferToImageBitmap()</a>
    <div>Creates an <a href="/en-US/docs/Web/API/ImageBitmap" title="The ImageBitmap interface represents a bitmap image which can be drawn to a <canvas> without undue latency. It can be created from a variety of source objects using the createImageBitmap() factory method. ImageBitmap provides an asynchronous and resource efficient pathway to prepare textures for rendering in WebGL."><code>ImageBitmap</code></a> object from the most recently rendered image of the <code>OffscreenCanvas</code>.</div>
  </li>
</ul>

## Events
