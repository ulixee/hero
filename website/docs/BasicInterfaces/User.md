# User

User instances allows you to control interaction with a browser instance.

## Constructor

User instances cannot be instantiated. You must retrieve a User from a [Browser](./browser) instance:

```js
const browser = await SecretAgent.createBrowser();
const user = browser.user;
```

## Properties

### user.cookies

Returns an array of cookie objects for this user.

#### **Type**: `Promise<Cookie[]>`

### user.storage

The current session DOM storage items (IDomStorage has a `localStorage`, `sessionStorage`, `indexedDB`).

#### **Type**: `{ [securityOrigin: string]: IDomStorage }`
 - `IDomStorage`
      - localStorage `[key,value][]`. Array of local storage key/value paris
      - sessionStorage `[key,value][]`. Array of session storage key/value paris
      - indexedDB `IndexedDb[]`. Array of IndexedDB databases with data

### user.lastCommandId

An execution point that refers to a command run by this user (`waitForElement`, `click`, `type`, etc). Command ids can be passed to select `waitFor*` functions to indicate a starting point to listen for changes.

#### **Type**: `number`

## Methods

### user.click*(mousePosition)* {#click}

Executes a click interaction. This is a shortcut for `user.interact({ click: mousePosition })`. See the [Interactions page](./interactions) for more details.

#### **Arguments**:

- mousePosition `MousePosition`

#### **Returns**: `Promise`

### user.interact*(interaction\[, interaction, ...])* {#interact}

Executes a series of mouse and keyboard interactions.

#### **Arguments**:

- interaction `Interaction`

#### **Returns**: `Promise`

Refer to the [Interactions page](./interactions) for details on how to construct an interaction.

### user.scrollTo*(mousePosition)* {#click}

Executes a scroll interaction. This is a shortcut for `user.interact({ scroll: mousePosition })`. See the [Interactions page](./interactions) for more details.

#### **Arguments**:

- mousePosition `MousePosition`

#### **Returns**: `Promise`

### user.type*(keyboardInteraction\[, keyboardInteraction, ...])* {#type}

Executes a keyboard interactions. This is a shortcut for `user.interact({ type: string | KeyName[] })`.

#### **Arguments**:

- keyboardInteraction `KeyboardInteraction`

#### **Returns**: `Promise`

Refer to the [Interactions page](./interactions) for details on how to construct keyboard interactions.


### user.exportProfile*()* {#export-profile}

Returns a json representation of this User for saving. This can later be restored into a browser instance using
`SecretAgent.createBrowser({ userProfile: serialized })`

#### **Returns**: `Promise<IUserProfile>`
