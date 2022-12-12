# HeroReplay

> HeroReplay is a specialized version of Hero that allows you to load and interact with previous Hero sessions without reloading the website and rerunning http traffic.

This class is barebones for the moment -- it contains a small list of properties such as retrieving DetachedElements and DetachedResources. Our long-term plans are to make this a full-fledged tool for reloading and interacting with the DOM and resources from previous Hero sessions.

## Constructor

HeroReplay accepts either a subset of Hero configuration settings, including a `replaySessionId`, or a Hero instance.

#### **Arguments**:

- _OPTION 1_ config `object` Accepts any of the following:
  - replaySessionId `string`. The sessionId of a previous session to replay.
  - connectionToCore `object`. OPTIONAL object containing `IConnectionToCoreOptions` used to connect, or an already created `ConnectionToCore` instance. Defaults to automatically booting up and connecting to a local `Core`.
- OR _OPTION 2_ config `object`.
  - hero `Hero`. An existing Hero object.

## Properties

### heroReplay.detachedElements

DetachedElements object providing access to all elements with `$detach` called from this script.

#### **Returns** [`DetachedElements`](../advanced-client/detached-elements.md)

### heroReplay.detachedResources

DetachedResources object providing access to all resources collected from this script.

#### **Returns** [`DetachedResources`](../advanced-client/detached-resources.md)

### heroReplay.sessionId

Readonly unique sessionId for this Session.

#### **Returns** `Promise<string>`

## Methods

### heroReplay.getSnippet *(key)* {#getSnippet}

Retrieves a value you previously stored with [hero.setSnippet](./hero.md#setSnippet).

```js
const heroReplay = new HeroReplay({/* sessionId */});
const when = await heroReplay.getSnippet('time');
```

#### **Arguments**:

- key `string`. The key you previously used to store the value.

#### **Returns**: `Promise<any>`
