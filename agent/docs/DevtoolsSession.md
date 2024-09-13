# Devtools Session

An object that can interact and subscribe to Devtools Protocol communications. This object provides "Typescript"-typed access to the protocol events.

For a full list of Protocol methods, see: https://chromedevtools.github.io/devtools-protocol/

## Instances

DevtoolsSession objects are automatically provisioned by Unblocked Agent. A Session is bound to a Page, Worker, Devtools Panel or Browser. You should not instantiate one.

## Methods

### send(method, params)

Sends a method to this session.

```js
const result = await this.devtoolsSession.send('Runtime.evaluate', {
  expression: 'document.readyState',
});
```

#### Arguments

- method `string`. The method to execute.
- params `object`. The parameters as defined in the Protocol for the given method.

### on(event, callbackFn)

Subscribe to a Devtools Protocol event for this session. NOTE: all EventEmitter syntax is supported (`addEventListener`, `once`, etc).

```js
this.devtoolsSession.on('Runtime.bindingCalled', event => {
  // process event
});
```

### off(event, callbackFn)

Unsubscribe the given callbackFn (function instance).
