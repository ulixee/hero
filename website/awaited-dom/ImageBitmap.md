# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> ImageBitmap

<div class='overview'>The <code><strong>ImageBitmap</strong></code> interface represents a bitmap image which can be drawn to a <code>&lt;canvas&gt;</code> without undue latency. It can be created from a variety of source objects using the <code>createImageBitmap()</code> factory method. <code>ImageBitmap</code> provides an asynchronous and resource efficient pathway to prepare textures for rendering in WebGL.</div>

## Properties

### .height <div class="specs"><i>W3C</i></div> {#height}

Is an <code>unsigned</code> <code>long</code> representing the height, in CSS pixels, of the <code>ImageData</code>.

#### **Type**: `Promise<number>`

### .width <div class="specs"><i>W3C</i></div> {#width}

Is an <code>unsigned</code> <code>long</code> representing the width, in CSS pixels, of the <code>ImageData</code>.

#### **Type**: `Promise<number>`

## Methods

### .close*()* <div class="specs"><i>W3C</i></div> {#close}


 <p>Disposes of all graphical resources associated with an <code>ImageBitmap</code>.</p>
 

#### **Returns**: `Promise<void>`
