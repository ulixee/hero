# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> FileList

<div class='overview'>An object of this type is returned by the <code>files</code> property of the HTML <a href="/en-US/docs/Web/HTML/Element/input" title="The HTML <input> element is used to create interactive controls for web-based forms in order to accept data from the user; a wide variety of types of input data and control widgets are available, depending on the device and user agent. "><code>&lt;input&gt;</code></a> element; this lets you access the list of files selected with the <code>&lt;input type="file"&gt;</code> element. It's also used for a list of files dropped into web content when using the drag and drop API; see the <a href="/en-US/docs/DragDrop/DataTransfer" title="DragDrop/DataTransfer"><code>DataTransfer</code></a> object for details on this usage.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

A read-only value indicating the number of files in the list.

#### **Type**: `null`

## Methods

### .item*(...args)* <div class="specs"><i>W3C</i></div> {#item}

Returns a <a href="/en-US/docs/DOM/File" title="DOM/File"><code>File</code>
</a> object representing the file at the specified index in the file list.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
