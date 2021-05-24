# Dialog

> Dialogs represent javascript alert, confirm and prompt informational messages.

The Dialog class is initiated from `window.alert`, `window.confirm`, and other dialog prompt calls in a webpage. Dialogs will block ALL execution of a webpage, so it is important to handle them by dismissing or taking appropriate action. To listen for dialogs, register a listener on each tab using `tab.on('dialog', (dialog: Dialog) => ...<callback>)`.

## Properties

### url

The url of the frame where this dialog was initiated.

#### **Returns** `string`

### message

The dialog message.

#### **Returns** `string`

### type

The type of dialog. Possible values are: 'alert', 'confirm', 'prompt' and 'beforeunload'.

#### **Returns** `string`

### defaultPrompt

Optional: The default dialog prompt

#### **Returns** `string`

## Methods

### dismiss<em>(accept[, promptText])</em>

Dismiss the dialog with the given values.

#### **Arguments**:

- accept `boolean`. Whether to hit the accept button or cancel/reject (if applicable).
- promptText `string`. Optional text to enter into a prompt field if present.

#### **Returns** `Promise<void>`
