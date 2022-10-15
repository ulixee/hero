# CollectedSnippets

> CollectedSnippets is a class to retrieve snippets of javascript data saved for extraction.

Occasionally in extraction, it's desirable to save information you extract during your [`run`](/docs/databox/basic-client/databox#constructor) function. This class allows you to retrieve "Snippets" collected using [extractLater](/docs/databox/advanced-client/runner#extract-later).

```js
import Databox from '@ulixee/databox-for-hero-playground';

export default new Databox({
  async run({ hero, extractLater }) {
    await hero.goto('https://ulixee.org');
    await hero.waitForPaintingStable();
    const localStorage = await hero.getJsValue('JSON.stringify(localStorage)');
    const sessionStorage = await hero.getJsValue('JSON.stringify(sessionStorage)');
    await extractLater('localStorage', localStorage);
    await extractLater('sessionStorage', sessionStorage);
  },
  async extract({ collectedSnippets, output }) {
    const local = await collectedSnippets.get('localStorage');
    const session = await collectedSnippets.get('sessionStorage');

    output.rootStorage = {
      local,
      session,
    };
  },
});
```

## Properties

### names

Retrieves all names that CollectedSnippets have been stored with.

#### **Returns** `Promise<string[]>`

## Methods

### collectedSnippets.get<IValueType\>_(name)_ {#get}

Get a single snippet value extracted with the given name.

An optional `IValueType` can be provided as a generic type in Typescript to give the return value a type.

#### **Arguments**:

- name `string`. The name of the snippet (assigned during extraction).

#### **Returns**: `Promise<IValueType>`

### collectedSnippets.getAll<IValueType\>_(name)_ {#get-all}

Get a list of snippet values extracted with the given name.

An optional `IValueType` can be provided as a generic type in Typescript to give the return value a type.

#### **Arguments**:

- name `string`. The name of the CollectedSnippets (assigned during extraction).

#### **Returns**: `Promise<IValueType[]>`
