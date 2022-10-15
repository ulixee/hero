# DetachedDOM

> DetachedDOM is designed for parsing and traversing local HTML fragments without needing a browser engine. It's similar to Cheerio or JSDOM except that it's lighter weight and more W3C compliant.

This library is currently a thin wrapper for [linkedom](https://github.com/WebReflection/linkedom), which Hero uses under the hood when you call hero.detach or element.$detach.

## Methods

### DetachedDOM.load<em>(html)</em>
#### **Arguments**:
- html `string` Raw HTML fragment that you want converted into a DOM structure
#### **Returns**: `DetachedDocument`

We need to write documentation on what methods are properties are available in a DetachedDOM element.

## Example

DetachedDOM stands alone outside the context of Hero or BrowserInstance. For example, here we load and parse a local HTML file:

```js
const fs = require('fs');
const { DetachedDOM } = require('@ulixee/hero');

const html = fs.readFileSync('/docs/hero/basic-client/saved.html', 'utf-8');
const fragment = DetachedDOM.loadFragment(html);

console.log(fragment.title);
````
