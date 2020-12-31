# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> OffscreenCanvas

<div class='overview'><strong>This is an experimental technology</strong><br>Check the <a href="#Browser_compatibility">Browser compatibility table</a> carefully before using this in production.</div>

## Properties

### .height <div class="specs"><i>W3C</i></div> {#height}

The height of the offscreen canvas.

#### **Type**: `Promise<number>`

### .width <div class="specs"><i>W3C</i></div> {#width}

The width of the offscreen canvas.

#### **Type**: `Promise<number>`

## Methods

### .convertToBlob*(options?)* <div class="specs"><i>W3C</i></div> {#convertToBlob}

Creates a <code>Blob</code> object representing the image contained in the canvas.

#### **Arguments**:


 - options `ImageEncodeOptions`. <p>You can specify several options when converting your <code>OffscreenCanvas</code> object into a <code>Blob</code> object, for example:</p>
     <pre class="notranslate">const blob = offscreenCanvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.95
    });</pre>
     <p>options:</p>
     <ul>
      <li>**<code>type</code>**: A `string` indicating the image format. The default type is&nbsp;<code>image/png</code>.</li>
      <li><code>**quality**</code>: A `number`&nbsp;between&nbsp;<code>0</code>&nbsp;and&nbsp;<code>1</code>&nbsp;indicating image quality if the&nbsp;<code>type</code>&nbsp;option is&nbsp;<code>image/jpeg</code>&nbsp;or&nbsp;<code>image/webp</code>. If this argument is anything else, the default value for image quality is used. Other arguments are ignored.</li>
     </ul>

#### **Returns**: `Promise<Blob>`

### .transferToImageBitmap*()* <div class="specs"><i>W3C</i></div> {#transferToImageBitmap}

Creates an <code>ImageBitmap</code> object from the most recently rendered image of the <code>OffscreenCanvas</code>.

#### **Returns**: [`ImageBitmap`](./image-bitmap)

## Unimplemented Specs

#### Methods

 |   |   | 
 | --- | --- | 
 | `getContext()` | `addEventListener()`
`dispatchEvent()` | `removeEventListener()` | 
