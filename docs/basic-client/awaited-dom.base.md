# AwaitedDOM

> AwaitedDOM is a NodeJs implementation of W3C's DOM specification that makes it easy to call properties and methods located in a remote browser engine as if they were local to your scraper script context.

AwaitedDOM currently implements a subset of the full DOM specification. Most of the readonly properties and methods have been implemented, however we haven't added DOM manipulation APIs because we believe they are too easy to detect by website bot blockers.

```js
const link = await hero.document.querySelector('a').href;
```

Explore the DOM classes listed on this page to see what has been implemented. You'll find a list of the unimplemented methods and properties located at the bottom of each page.

## Hero DOM Extensions

AwaitedDOM adds several DOM extensions to make Hero easier to use. These extensions are prefixed with the "$" character to keep "non-standard" methods/properties separate from the standard implementation. You can find the [full list here](./awaited-dom-extensions.md).

```js
await hero.querySelector('.element').$click();
```

## Document Interfaces

[INTERFACES:Document]

## Node Interfaces

[INTERFACES:Node]

## HTML Elements

[INTERFACES:HTMLElement]

## SVG Elements

[INTERFACES:SVGElement]

## Array-like Interfaces

[INTERFACES:ArrayLike]

## XPath Interfaces

[INTERFACES:XPath]

## Miscellaneous Interfaces

[INTERFACES:Miscellaneous]
