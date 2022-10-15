# HeroReplay

> HeroReplay is a specialized version of Hero that allows you to load and interact with previous Hero sessions without reloading the website and rerunning http traffic.

This class is barebones for the moment -- it contians a small list of properties for retriving DetachedElements, DetachedResources and CollectedSnippets. Our long-term plans are to make this a full-fledged Hero just without the methods for trigging new http traffic. Instead, HeroReplay will have specialized methods for reloading and interacting with the DOM and resources from previous Hero sessions.

## Constructor

HeroReplay accepts the same initialization options as Hero with one extra required value: previousSessionId.

#### **Arguments**:

- options `object` Accepts any of the following:
  - previousSessionId `options | ConnectionToCore`. An object containing `IConnectionToCoreOptions` used to connect, or an already created `ConnectionToCore` instance. Defaults to automatically booting up and connecting to a local `Core`.

## Properties

### heroReplay.detachedElements

DetachedElements object providing access to all elements with `$detach` called from this script.

#### **Returns** [`DetachedElements`](/docs/databox/advanced-client/detached-elements)

### heroReplay.detachedResources

DetachedResources object providing access to all resources collected from this script.

#### **Returns** [`DetachedResources`](/docs/databox/advanced-client/detached-resources)

### heroReplay.collectedSnippets

CollectedSnippets object providing access to all snippets collected from this script.

#### **Returns** [`CollectedSnippets`](/docs/databox/advanced-client/collected-snippets)

### heroReplay.sessionId

Readonly unique sessionId for this Session.

#### **Returns** `Promise<string>`
