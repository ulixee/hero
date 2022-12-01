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

|     |     |
| --- | --- |
| [Document](../awaited-dom/document.md) | [DocumentFragment](../awaited-dom/document-fragment.md) |
| [HTMLDocument](../awaited-dom/html-document.md) | [XMLDocument](../awaited-dom/xml-document.md) |
| [XPathEvaluator](../awaited-dom/xpath-evaluator.md) |  |


## Node Interfaces

|     |     |
| --- | --- |
| [Comment](../awaited-dom/comment.md) | [Element](../awaited-dom/element.md) |
| [Node](../awaited-dom/node.md) | [Text](../awaited-dom/text.md) |


## HTML Elements

|     |     |
| --- | --- |
| [HTMLAnchorElement](../awaited-dom/html-anchor-element.md) | [HTMLAreaElement](../awaited-dom/html-area-element.md) |
| [HTMLAudioElement](../awaited-dom/html-audio-element.md) | [HTMLBRElement](../awaited-dom/html-br-element.md) |
| [HTMLBaseElement](../awaited-dom/html-base-element.md) | [HTMLBodyElement](../awaited-dom/html-body-element.md) |
| [HTMLButtonElement](../awaited-dom/html-button-element.md) | [HTMLCanvasElement](../awaited-dom/html-canvas-element.md) |
| [HTMLDListElement](../awaited-dom/html-d-list-element.md) | [HTMLDataElement](../awaited-dom/html-data-element.md) |
| [HTMLDataListElement](../awaited-dom/html-data-list-element.md) | [HTMLDetailsElement](../awaited-dom/html-details-element.md) |
| [HTMLDialogElement](../awaited-dom/html-dialog-element.md) | [HTMLDivElement](../awaited-dom/html-div-element.md) |
| [HTMLElement](../awaited-dom/html-element.md) | [HTMLEmbedElement](../awaited-dom/html-embed-element.md) |
| [HTMLFieldSetElement](../awaited-dom/html-field-set-element.md) | [HTMLFontElement](../awaited-dom/html-font-element.md) |
| [HTMLFormElement](../awaited-dom/html-form-element.md) | [HTMLFrameSetElement](../awaited-dom/html-frame-set-element.md) |
| [HTMLHRElement](../awaited-dom/html-hr-element.md) | [HTMLHeadElement](../awaited-dom/html-head-element.md) |
| [HTMLHeadingElement](../awaited-dom/html-heading-element.md) | [HTMLHtmlElement](../awaited-dom/html-html-element.md) |
| [HTMLIFrameElement](../awaited-dom/html-iframe-element.md) | [HTMLImageElement](../awaited-dom/html-image-element.md) |
| [HTMLInputElement](../awaited-dom/html-input-element.md) | [HTMLLIElement](../awaited-dom/html-li-element.md) |
| [HTMLLabelElement](../awaited-dom/html-label-element.md) | [HTMLLegendElement](../awaited-dom/html-legend-element.md) |
| [HTMLLinkElement](../awaited-dom/html-link-element.md) | [HTMLMapElement](../awaited-dom/html-map-element.md) |
| [HTMLMarqueeElement](../awaited-dom/html-marquee-element.md) | [HTMLMediaElement](../awaited-dom/html-media-element.md) |
| [HTMLMenuElement](../awaited-dom/html-menu-element.md) | [HTMLMetaElement](../awaited-dom/html-meta-element.md) |
| [HTMLMeterElement](../awaited-dom/html-meter-element.md) | [HTMLModElement](../awaited-dom/html-mod-element.md) |
| [HTMLOListElement](../awaited-dom/html-o-list-element.md) | [HTMLObjectElement](../awaited-dom/html-object-element.md) |
| [HTMLOptGroupElement](../awaited-dom/html-opt-group-element.md) | [HTMLOptionElement](../awaited-dom/html-option-element.md) |
| [HTMLOutputElement](../awaited-dom/html-output-element.md) | [HTMLParagraphElement](../awaited-dom/html-paragraph-element.md) |
| [HTMLParamElement](../awaited-dom/html-param-element.md) | [HTMLPictureElement](../awaited-dom/html-picture-element.md) |
| [HTMLPreElement](../awaited-dom/html-pre-element.md) | [HTMLProgressElement](../awaited-dom/html-progress-element.md) |
| [HTMLQuoteElement](../awaited-dom/html-quote-element.md) | [HTMLScriptElement](../awaited-dom/html-script-element.md) |
| [HTMLSelectElement](../awaited-dom/html-select-element.md) | [HTMLSlotElement](../awaited-dom/html-slot-element.md) |
| [HTMLSourceElement](../awaited-dom/html-source-element.md) | [HTMLSpanElement](../awaited-dom/html-span-element.md) |
| [HTMLStyleElement](../awaited-dom/html-style-element.md) | [HTMLTableCaptionElement](../awaited-dom/html-table-caption-element.md) |
| [HTMLTableCellElement](../awaited-dom/html-table-cell-element.md) | [HTMLTableColElement](../awaited-dom/html-table-col-element.md) |
| [HTMLTableElement](../awaited-dom/html-table-element.md) | [HTMLTableRowElement](../awaited-dom/html-table-row-element.md) |
| [HTMLTableSectionElement](../awaited-dom/html-table-section-element.md) | [HTMLTemplateElement](../awaited-dom/html-template-element.md) |
| [HTMLTextAreaElement](../awaited-dom/html-text-area-element.md) | [HTMLTimeElement](../awaited-dom/html-time-element.md) |
| [HTMLTitleElement](../awaited-dom/html-title-element.md) | [HTMLTrackElement](../awaited-dom/html-track-element.md) |
| [HTMLUListElement](../awaited-dom/html-u-list-element.md) | [HTMLUnknownElement](../awaited-dom/html-unknown-element.md) |
| [HTMLVideoElement](../awaited-dom/html-video-element.md) |  |


## SVG Elements

|     |     |
| --- | --- |
| [SVGElement](../awaited-dom/svg-element.md) | [SVGGraphicsElement](../awaited-dom/svg-graphics-element.md) |
| [SVGSVGElement](../awaited-dom/svgsvg-element.md) | [SVGTitleElement](../awaited-dom/svg-title-element.md) |


## Array-like Interfaces

|     |     |
| --- | --- |
| [HTMLCollection](../awaited-dom/html-collection.md) | [HTMLOptionsCollection](../awaited-dom/html-options-collection.md) |
| [NodeList](../awaited-dom/node-list.md) | [RadioNodeList](../awaited-dom/radio-node-list.md) |


## XPath Interfaces

|     |     |
| --- | --- |
| [XPathEvaluator](../awaited-dom/xpath-evaluator.md) | [XPathEvaluatorBase](../awaited-dom/xpath-evaluator-base.md) |
| [XPathExpression](../awaited-dom/xpath-expression.md) | [XPathNSResolver](../awaited-dom/xpath-ns-resolver.md) |
| [XPathResult](../awaited-dom/xpath-result.md) |  |


## Miscellaneous Interfaces

|     |     |
| --- | --- |
| [Attr](../awaited-dom/attr.md) | [CharacterData](../awaited-dom/character-data.md) |
| [EventTarget](../awaited-dom/event-target.md) | [Request](../awaited-dom/request.md) |
| [Response](../awaited-dom/response.md) | [Storage](../awaited-dom/storage.md) |

