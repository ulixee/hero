# Flow Handling

> Flow is the definition of handlers around states a webpage can exist, and controls to restore your desired scraper script state.


Often while building a scraper script, the script is built to handle the "clean path". This path does not handle situations where a website asks you to reduce traffic requests, or has prompted for a cookie consent agreement. We found that it can be quite challenging to program around these scenarios in a clean way.

### Flow Handlers

To that end, FlowHandlers were created. FlowHandlers allow you to define a "State" that the page can be in, and a "Resolver" to correct the state and resume your "clean path". Because these are outlier paths, the expectation is that FlowHandlers will click the consent button and resume, or redirect back to the page you wish to be on (if you've been sent to another page).

```js
await hero.registerFlowHandler('CookieModal', assert => {
  assert(hero.querySelector('#cookie-modal').$isVisible);
},
async error => {
  await hero.querySelector('#cookie-modal .dismiss').$click();
});
```

NOTE: If the "flow" cannot be resumed, a FlowHandler should throw an error to indicate to a "controlling" process how to retry the activity.

### When a Flow Handler will Trigger

FlowHandlers are automatically checked anytime an AwaitedDOM error occurs. These errors are things like: an element can't be found, an element interaction failed, or waiting for an element [State](/docs/hero/advanced-client/tab#wait-for-state) timed out.

### Flow Commands

[FlowCommands](/docs/hero/advanced-client/tab#flow-commands) are ways to group a series of commands together that should be re-run as a unit when an AwaitedDOM error occurs. This is often useful in more complicated Flow scenarios: eg, where a Form validation has failed that requires re-typing information for an autocomplete list, or the Tab has redirected to an error page and the flow needs to restart. You would want to ensure all steps are run when a failure is encountered.

```js
await hero.flowCommand(async () => {
  await hero.querySelector('#field1').$click();
  await hero.querySelector('#field1').$clearInputText();

  // Failure here resumes the entire block once a FlowHandler fixes the state
  await hero.querySelector('#field1').$type('value');
});
```

Flow Commands can be nested within each other. If nested commands cannot be completed due to AwaitedDOM errors (interactions, dom errors, dom state timeouts), they will trigger the outermost block to be re-tried.
