# DetachedResources

> DetachedResources is a class to retrieve Hero Resources saved for extraction. They include all network assets loaded to render a page, including CSS, Javascript, Fonts, Web Sockets, XHR/Fetch Requests, and more.

Hero [Resources](/docs/hero/advanced-client/resources) represent resources used to render a Page, including the HTTP Requests to retrieve them.

Examples of this include JSON files, HTML Documents, PDFs, etc.

Saving them for extraction can be desirable because you can reload them into a [HeroReplay](/docs/hero/basic-client/hero-replay) instance repeatedly without having to restart a Headless browser (which can be significantly slower). Once they're saved, you can rapidly iterate on your extraction logic (eg, to transform a JSON payload) until it produces the desired output.

```js
import Hero from '@ulixee/hero-playground';

async function run() {
  const hero = new Hero();
  await hero.activeTab.on('resource', async resource => {
    if (resource.type === 'XHR') {
      await resource.$extractLater('xhr');
    }
  });
  await hero.goto('https://ulixee.org');
  await hero.waitForPaintingStable();
}

async function replay(sessionId) {
  const heroReplay = new HeroReplay(sessionId);
  const xhrs = await heroReplay.detachedResources.getAll('xhr');
  const gridsomeData = [];
  for (const xhr of xhrs) {
    // NOTE: synchronous APIs.
    const jsonObject = xhr.json;
    if (xhr.json?.data) {
      gridsomeData.push(xhr.json.data);
    }
  }
}
```

## Properties

### names

Retrieves all names that DetachedResources have been stored with.

#### **Returns** `Promise<string[]>`

## Methods

### detachedResources.get _(name)_ {#get}

Get a single [Resource](/docs/hero/advanced-client/resource) extracted with the given name. All [Response](/docs/hero/advanced-client/resource-response) data is pre-fetched and decompressed (if necessary).

#### **Arguments**:

- name `string`. The name of the [Resource](/docs/hero/advanced-client/resource) to retrieve (assigned during extraction).

#### **Returns**: [`Promise<Resource>`](/docs/hero/advanced-client/resource) The [Resource](/docs/hero/advanced-client/resource).

### detachedResources.getAll _(name)_ {#get-all}

Get a list of [Resources](/docs/hero/advanced-client/resource) extracted with the given name. All [Response](/docs/hero/advanced-client/resource-response) data is pre-fetched and decompressed (if necessary).

#### **Arguments**:

- name `string`. The name of the [Resources](/docs/hero/advanced-client/resource) to retrieve (assigned during extraction).

#### **Returns**: [`Promise<Resource[]>`](/docs/hero/advanced-client/resource) The [Resources](/docs/hero/advanced-client/resource).
