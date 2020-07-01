# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> File

<div class='overview'>The <strong><code>File</code></strong> interface provides information about files and allows JavaScript in a web page to access their content.</div>

<div class='overview'><code>File</code> objects are generally retrieved from a <a href="/en-US/docs/Web/API/FileList" title="An object of this type is returned by the files property of the HTML <input> element; this lets you access the list of files selected with the <input type=&quot;file&quot;> element. It's also used for a list of files dropped into web content when using the drag and drop API; see the DataTransfer object for details on this usage."><code>FileList</code></a> object returned as a result of a user selecting files using the&nbsp;<a href="/en-US/docs/Web/HTML/Element/input" title="The HTML <input> element is used to create interactive controls for web-based forms in order to accept data from the user; a wide variety of types of input data and control widgets are available, depending on the device and user agent. "><code>&lt;input&gt;</code></a>&nbsp;element, from a drag and drop operation's <a href="/en-US/docs/Web/API/DataTransfer" title="The DataTransfer object is used to hold the data that is being dragged during a drag and drop operation. It may hold one or more data items, each of one or more data types. For more information about drag and drop, see HTML Drag and Drop API."><code>DataTransfer</code></a> object, or from the&nbsp;<code>mozGetAsFile()</code>&nbsp;API on an&nbsp;<a href="/en-US/docs/Web/API/HTMLCanvasElement" title="The HTMLCanvasElement interface provides properties and methods for manipulating the layout and presentation of <canvas> elements. The HTMLCanvasElement interface also inherits the properties and methods of the HTMLElement interface."><code>HTMLCanvasElement</code></a>.</div>

<div class='overview'>A <code>File</code> object is a specific kind of a <a href="/en-US/docs/Web/API/Blob" title="A Blob object represents a file-like object of immutable, raw data; they can be read as text or binary data, or converted into a ReadableStream so its methods can be used for processing the data. Blobs can represent data that isn't necessarily in a JavaScript-native format. The File interface is based on Blob, inheriting blob functionality and expanding it to support files on the user's system."><code>Blob</code></a>, and can be used in any context that a Blob can. In particular, <a href="/en-US/docs/Web/API/FileReader" title="The FileReader object lets web applications asynchronously read the contents of files (or raw data buffers) stored on the user's computer, using File or Blob objects to specify the file or data to read."><code>FileReader</code></a>, <a href="/en-US/docs/Web/API/URL/createObjectURL" title="The URL.createObjectURL() static method creates a DOMString containing a&nbsp;URL representing the object given in the parameter. The URL lifetime is tied to the document in the window on which it was created. The new object URL represents the specified File object or Blob object."><code>URL.createObjectURL()</code></a>, <a href="/en-US/docs/Web/API/ImageBitmapFactories/createImageBitmap" title="The documentation about this has not yet been written; please consider contributing!"><code>createImageBitmap()</code></a>, and <a href="/en-US/docs/Web/API/XMLHttpRequest#send()" title=""><code>XMLHttpRequest.send()</code></a> accept both <code>Blob</code>s and <code>File</code>s.</div>

<div class='overview'>See <a href="/en-US/docs/Using_files_from_web_applications">Using files from web applications</a> for more information and examples.</div>

## Properties

### .lastModified <div class="specs"><i>W3C</i></div> {#lastModified}

Returns the last modified time of the file, in millisecond since the UNIX epoch (January 1st, 1970 at Midnight).

#### **Type**: `null`

### .name <div class="specs"><i>W3C</i></div> {#name}

Returns the name of the file referenced by the <code>File
</code> object.

#### **Type**: `null`
