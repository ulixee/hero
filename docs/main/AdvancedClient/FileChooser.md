# FileChooser

> FileChoosers represent a prompt to input one or more file.

The FileChooser class is initiated by clicking on a file input. This class will be return by calling [`tab.waitForFileChooser`](/docs/hero/basic-client/tab#wait-for-file-chooser).

## Properties

### inputElement

The element that was clicked on to initiate this prompt.

#### **Returns** `HTMLInputElement`

### acceptsMultipleFiles

If multiple files are supported.

#### **Returns** `boolean`

## Methods

### chooseFiles<em>(file[, ...files])</em>

Supply one or more files to set on this input. Mimetype will be inferred from the provided files.

#### **Arguments**:

One or more `File` arguments. A file can be either:
 - path `string`. A full path to a file to be uploaded.
 - file `Object`. An object with the following properties: 
   - data `Buffer`. File contents as a Node.js Buffer.
   - name `string`. The filename to use for this file.

#### **Returns** `Promise<void>`
