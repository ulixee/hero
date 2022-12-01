# AwaitedDOM

> AwaitedDOM is a NodeJs implementation of W3C's DOM specification that makes it easy to call properties and methods located in a remote browser engine as if they were local to your scraper script context.

AwaitedDOM currently implements a subset of the full DOM specification. Most of the readonly properties and methods have been implemented, however we haven't added DOM manipulation APIs because we believe they are too easy to detect by website bot blockers.

```js
const link = await hero.document.querySelector('a').href;
```

Explore the DOM classes listed on this page to see what has been implemented. You'll find a list of the unimplemented methods and properties located at the bottom of each page.

## Hero DOM Extensions

AwaitedDOM adds several DOM extensions to make Hero easier to use. These extensions are prefixed with the "$" character to keep "non-standard" methods/properties separate from the standard implementation. You can find the [full list here](../basic-client/awaited-dom-extensions.md).

```js
await hero.querySelector('.element').$click();
```

## Document Interfaces

|     |     |
| --- | --- |
| [Document](./document.md) | [DocumentFragment](./document-fragment.md) |
| [HTMLDocument](./html-document.md) | [XMLDocument](./xml-document.md) |
| [XPathEvaluator](./xpath-evaluator.md) |  |


## Node Interfaces

|     |     |
| --- | --- |
| [Comment](./comment.md) | [Element](./element.md) |
| [Node](./node.md) | [Text](./text.md) |


## HTML Elements

|     |     |
| --- | --- |
| [HTMLAnchorElement](./html-anchor-element.md) | [HTMLAreaElement](./html-area-element.md) |
| [HTMLAudioElement](./html-audio-element.md) | [HTMLBRElement](./html-br-element.md) |
| [HTMLBaseElement](./html-base-element.md) | [HTMLBodyElement](./html-body-element.md) |
| [HTMLButtonElement](./html-button-element.md) | [HTMLCanvasElement](./html-canvas-element.md) |
| [HTMLDListElement](./html-d-list-element.md) | [HTMLDataElement](./html-data-element.md) |
| [HTMLDataListElement](./html-data-list-element.md) | [HTMLDetailsElement](./html-details-element.md) |
| [HTMLDialogElement](./html-dialog-element.md) | [HTMLDivElement](./html-div-element.md) |
| [HTMLElement](./html-element.md) | [HTMLEmbedElement](./html-embed-element.md) |
| [HTMLFieldSetElement](./html-field-set-element.md) | [HTMLFontElement](./html-font-element.md) |
| [HTMLFormElement](./html-form-element.md) | [HTMLFrameSetElement](./html-frame-set-element.md) |
| [HTMLHRElement](./html-hr-element.md) | [HTMLHeadElement](./html-head-element.md) |
| [HTMLHeadingElement](./html-heading-element.md) | [HTMLHtmlElement](./html-html-element.md) |
| [HTMLIFrameElement](./html-iframe-element.md) | [HTMLImageElement](./html-image-element.md) |
| [HTMLInputElement](./html-input-element.md) | [HTMLLIElement](./html-li-element.md) |
| [HTMLLabelElement](./html-label-element.md) | [HTMLLegendElement](./html-legend-element.md) |
| [HTMLLinkElement](./html-link-element.md) | [HTMLMapElement](./html-map-element.md) |
| [HTMLMarqueeElement](./html-marquee-element.md) | [HTMLMediaElement](./html-media-element.md) |
| [HTMLMenuElement](./html-menu-element.md) | [HTMLMetaElement](./html-meta-element.md) |
| [HTMLMeterElement](./html-meter-element.md) | [HTMLModElement](./html-mod-element.md) |
| [HTMLOListElement](./html-o-list-element.md) | [HTMLObjectElement](./html-object-element.md) |
| [HTMLOptGroupElement](./html-opt-group-element.md) | [HTMLOptionElement](./html-option-element.md) |
| [HTMLOutputElement](./html-output-element.md) | [HTMLParagraphElement](./html-paragraph-element.md) |
| [HTMLParamElement](./html-param-element.md) | [HTMLPictureElement](./html-picture-element.md) |
| [HTMLPreElement](./html-pre-element.md) | [HTMLProgressElement](./html-progress-element.md) |
| [HTMLQuoteElement](./html-quote-element.md) | [HTMLScriptElement](./html-script-element.md) |
| [HTMLSelectElement](./html-select-element.md) | [HTMLSlotElement](./html-slot-element.md) |
| [HTMLSourceElement](./html-source-element.md) | [HTMLSpanElement](./html-span-element.md) |
| [HTMLStyleElement](./html-style-element.md) | [HTMLTableCaptionElement](./html-table-caption-element.md) |
| [HTMLTableCellElement](./html-table-cell-element.md) | [HTMLTableColElement](./html-table-col-element.md) |
| [HTMLTableElement](./html-table-element.md) | [HTMLTableRowElement](./html-table-row-element.md) |
| [HTMLTableSectionElement](./html-table-section-element.md) | [HTMLTemplateElement](./html-template-element.md) |
| [HTMLTextAreaElement](./html-text-area-element.md) | [HTMLTimeElement](./html-time-element.md) |
| [HTMLTitleElement](./html-title-element.md) | [HTMLTrackElement](./html-track-element.md) |
| [HTMLUListElement](./html-u-list-element.md) | [HTMLUnknownElement](./html-unknown-element.md) |
| [HTMLVideoElement](./html-video-element.md) |  |


## SVG Elements

|     |     |
| --- | --- |
| [SVGElement](./svg-element.md) | [SVGGraphicsElement](./svg-graphics-element.md) |
| [SVGSVGElement](./svgsvg-element.md) | [SVGTitleElement](./svg-title-element.md) |


## Array-like Interfaces

|     |     |
| --- | --- |
| [HTMLCollection](./html-collection.md) | [HTMLOptionsCollection](./html-options-collection.md) |
| [NodeList](./node-list.md) | [RadioNodeList](./radio-node-list.md) |


## XPath Interfaces

|     |     |
| --- | --- |
| [XPathEvaluator](./xpath-evaluator.md) | [XPathEvaluatorBase](./xpath-evaluator-base.md) |
| [XPathExpression](./xpath-expression.md) | [XPathNSResolver](./xpath-ns-resolver.md) |
| [XPathResult](./xpath-result.md) |  |


## Miscellaneous Interfaces

|     |     |
| --- | --- |
| [Attr](./attr.md) | [CharacterData](./character-data.md) |
| [EventTarget](./event-target.md) | [Request](./request.md) |
| [Response](./response.md) | [Storage](./storage.md) |

