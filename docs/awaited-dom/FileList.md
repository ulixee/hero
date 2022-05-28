# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> FileList

<div class='overview'>An object of this type is returned by the <code>files</code> property of the HTML <code>&lt;input&gt;</code> element; this lets you access the list of files selected with the <code>&lt;input type="file"&gt;</code> element. It's also used for a list of files dropped into web content when using the drag and drop API; see the <code>DataTransfer</code> object for details on this usage.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

A read-only value indicating the number of files in the list.

#### **Type**: `Promise<number>`

## Methods

### .item *(index)* <div class="specs"><i>W3C</i></div> {#item}

Returns a <code>File</code> object representing the file at the specified index in the file list.

#### **Arguments**:


 - index `number`. Needs content.

#### **Returns**: [`File`](/docs/awaited-dom/file)
