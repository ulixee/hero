# DetachedElement

> DetachedElement is designed for parsing and traversing local HTML fragments without needing a browser engine. It's similar to Cheerio or JSDOM except that it's lighter weight and more W3C compliant.

This library is currently a thin wrapper for [linkedom](https://github.com/WebReflection/linkedom), which Hero uses under the hood when you call hero.detach(element) or element.$detach().

## Methods

### DetachedElement.load<em>(html)</em>
#### **Arguments**:
- html `string` Raw HTML fragment that you want converted into a DOM structure
#### **Returns**: `DetachedDocument`

We need to write documentation on what methods are properties are available in a DetachedElement.

## Example

DetachedElement stands alone outside the context of Hero or BrowserInstance. For example, here we load and parse a local HTML file:

```js
const fs = require('fs');
const { DetachedElement } = require('@ulixee/hero');

const html = fs.readFileSync('/docs/hero/basic-client/saved.html', 'utf-8');
const element = DetachedElement.load(html);

const elementTitle = element.getAttribute('title'); // no await

console.log(elementTitle);
````
