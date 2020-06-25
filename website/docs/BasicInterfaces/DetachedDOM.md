# DetachedDOM

> DetachedDOM is designed for parsing and traversing local HTML markup without needing a browser engine. It's similar to Cheerio or JSDOM except that it's fully W3C compliant, and it uses the same underlying DOM engine as the AwaitedDOM.

## Methods

### DetachedDOM.load<em>(html)</em>
#### **Arguments**:
- html `string` Raw HTML that you want converted to a DOM structure
#### **Returns**: `DetachedDocument`

We need to write documentation on what methods are properties are available in a DetachedDocument.

## Example

DetachedDOM stands alone outside the context of SecretAgent or BrowserInstance. For example, here we load and parse a local HTML file:

```js
const fs = require('fs');
const { DetachedDOM } = require('secret-agent');

const html = fs.readFileSync('./saved.html', 'utf-8');
const document = DetachedDOM.load(html);

console.log(document.title);
````
