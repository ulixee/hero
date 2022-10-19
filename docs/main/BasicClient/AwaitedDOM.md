# AwaitedDOM

> AwaitedDOM is a NodeJs implementation of W3C's DOM specification that makes it easy to call properties and methods located in a remote browser engine as if they were local to your scraper script's context.

AwaitedDOM currently implements a subset of the full DOM specification. Most of the readonly properties and methods have been implemented, however we haven't added DOM manipulation APIs because we believe they are too easy to detect by website bot blockers.

Explore the DOM classes listed on this page to see what has been implmented. You'll find a list of the unimplemented methods and properties located at the bottom of each page.

## First, The DOM Extensions

AwaitedDOM adds several DOM extensions to make Hero easier to use. These extensions are prefixed with the "$" character to keep  "non-standard" methods/properties separate from the standard implementation. You can find [the full list here](/docs/hero/basic-client/awaited-dom-extensions).

## Document Interfaces

|     |     |
| --- | --- |
| [Document](/docs/hero/awaited-dom/document) | [DocumentFragment](/docs/hero/awaited-dom/document-fragment) |
| [HTMLDocument](/docs/hero/awaited-dom/html-document) | [XMLDocument](/docs/hero/awaited-dom/xml-document) |
| [XPathEvaluator](/docs/hero/awaited-dom/x-path-evaluator) |  |


## Node Interfaces

|     |     |
| --- | --- |
| [Comment](/docs/hero/awaited-dom/comment) | [Element](/docs/hero/awaited-dom/element) |
| [Node](/docs/hero/awaited-dom/node) | [Text](/docs/hero/awaited-dom/text) |


## HTML Elements

|     |     |
| --- | --- |
| [HTMLAnchorElement](/docs/hero/awaited-dom/html-anchor-element) | [HTMLAreaElement](/docs/hero/awaited-dom/html-area-element) |
| [HTMLAudioElement](/docs/hero/awaited-dom/html-audio-element) | [HTMLBRElement](/docs/hero/awaited-dom/htmlbr-element) |
| [HTMLBaseElement](/docs/hero/awaited-dom/html-base-element) | [HTMLBodyElement](/docs/hero/awaited-dom/html-body-element) |
| [HTMLButtonElement](/docs/hero/awaited-dom/html-button-element) | [HTMLCanvasElement](/docs/hero/awaited-dom/html-canvas-element) |
| [HTMLDListElement](/docs/hero/awaited-dom/htmld-list-element) | [HTMLDataElement](/docs/hero/awaited-dom/html-data-element) |
| [HTMLDataListElement](/docs/hero/awaited-dom/html-data-list-element) | [HTMLDetailsElement](/docs/hero/awaited-dom/html-details-element) |
| [HTMLDialogElement](/docs/hero/awaited-dom/html-dialog-element) | [HTMLDivElement](/docs/hero/awaited-dom/html-div-element) |
| [HTMLElement](/docs/hero/awaited-dom/html-element) | [HTMLEmbedElement](/docs/hero/awaited-dom/html-embed-element) |
| [HTMLFieldSetElement](/docs/hero/awaited-dom/html-field-set-element) | [HTMLFontElement](/docs/hero/awaited-dom/html-font-element) |
| [HTMLFormElement](/docs/hero/awaited-dom/html-form-element) | [HTMLFrameSetElement](/docs/hero/awaited-dom/html-frame-set-element) |
| [HTMLHRElement](/docs/hero/awaited-dom/htmlhr-element) | [HTMLHeadElement](/docs/hero/awaited-dom/html-head-element) |
| [HTMLHeadingElement](/docs/hero/awaited-dom/html-heading-element) | [HTMLHtmlElement](/docs/hero/awaited-dom/html-html-element) |
| [HTMLIFrameElement](/docs/hero/awaited-dom/htmli-frame-element) | [HTMLImageElement](/docs/hero/awaited-dom/html-image-element) |
| [HTMLInputElement](/docs/hero/awaited-dom/html-input-element) | [HTMLLIElement](/docs/hero/awaited-dom/htmlli-element) |
| [HTMLLabelElement](/docs/hero/awaited-dom/html-label-element) | [HTMLLegendElement](/docs/hero/awaited-dom/html-legend-element) |
| [HTMLLinkElement](/docs/hero/awaited-dom/html-link-element) | [HTMLMapElement](/docs/hero/awaited-dom/html-map-element) |
| [HTMLMarqueeElement](/docs/hero/awaited-dom/html-marquee-element) | [HTMLMediaElement](/docs/hero/awaited-dom/html-media-element) |
| [HTMLMenuElement](/docs/hero/awaited-dom/html-menu-element) | [HTMLMetaElement](/docs/hero/awaited-dom/html-meta-element) |
| [HTMLMeterElement](/docs/hero/awaited-dom/html-meter-element) | [HTMLModElement](/docs/hero/awaited-dom/html-mod-element) |
| [HTMLOListElement](/docs/hero/awaited-dom/htmlo-list-element) | [HTMLObjectElement](/docs/hero/awaited-dom/html-object-element) |
| [HTMLOptGroupElement](/docs/hero/awaited-dom/html-opt-group-element) | [HTMLOptionElement](/docs/hero/awaited-dom/html-option-element) |
| [HTMLOutputElement](/docs/hero/awaited-dom/html-output-element) | [HTMLParagraphElement](/docs/hero/awaited-dom/html-paragraph-element) |
| [HTMLParamElement](/docs/hero/awaited-dom/html-param-element) | [HTMLPictureElement](/docs/hero/awaited-dom/html-picture-element) |
| [HTMLPreElement](/docs/hero/awaited-dom/html-pre-element) | [HTMLProgressElement](/docs/hero/awaited-dom/html-progress-element) |
| [HTMLQuoteElement](/docs/hero/awaited-dom/html-quote-element) | [HTMLScriptElement](/docs/hero/awaited-dom/html-script-element) |
| [HTMLSelectElement](/docs/hero/awaited-dom/html-select-element) | [HTMLSlotElement](/docs/hero/awaited-dom/html-slot-element) |
| [HTMLSourceElement](/docs/hero/awaited-dom/html-source-element) | [HTMLSpanElement](/docs/hero/awaited-dom/html-span-element) |
| [HTMLStyleElement](/docs/hero/awaited-dom/html-style-element) | [HTMLTableCaptionElement](/docs/hero/awaited-dom/html-table-caption-element) |
| [HTMLTableCellElement](/docs/hero/awaited-dom/html-table-cell-element) | [HTMLTableColElement](/docs/hero/awaited-dom/html-table-col-element) |
| [HTMLTableElement](/docs/hero/awaited-dom/html-table-element) | [HTMLTableRowElement](/docs/hero/awaited-dom/html-table-row-element) |
| [HTMLTableSectionElement](/docs/hero/awaited-dom/html-table-section-element) | [HTMLTemplateElement](/docs/hero/awaited-dom/html-template-element) |
| [HTMLTextAreaElement](/docs/hero/awaited-dom/html-text-area-element) | [HTMLTimeElement](/docs/hero/awaited-dom/html-time-element) |
| [HTMLTitleElement](/docs/hero/awaited-dom/html-title-element) | [HTMLTrackElement](/docs/hero/awaited-dom/html-track-element) |
| [HTMLUListElement](/docs/hero/awaited-dom/htmlu-list-element) | [HTMLUnknownElement](/docs/hero/awaited-dom/html-unknown-element) |
| [HTMLVideoElement](/docs/hero/awaited-dom/html-video-element) |  |


## SVG Elements

|     |     |
| --- | --- |
| [SVGElement](/docs/hero/awaited-dom/svg-element) | [SVGGraphicsElement](/docs/hero/awaited-dom/svg-graphics-element) |
| [SVGSVGElement](/docs/hero/awaited-dom/svgsvg-element) | [SVGTitleElement](/docs/hero/awaited-dom/svg-title-element) |


## Array-like Interfaces

|     |     |
| --- | --- |
| [HTMLCollection](/docs/hero/awaited-dom/html-collection) | [HTMLOptionsCollection](/docs/hero/awaited-dom/html-options-collection) |
| [NodeList](/docs/hero/awaited-dom/node-list) | [RadioNodeList](/docs/hero/awaited-dom/radio-node-list) |


## XPath Interfaces

|     |     |
| --- | --- |
| [XPathEvaluator](/docs/hero/awaited-dom/x-path-evaluator) | [XPathEvaluatorBase](/docs/hero/awaited-dom/x-path-evaluator-base) |
| [XPathExpression](/docs/hero/awaited-dom/x-path-expression) | [XPathNSResolver](/docs/hero/awaited-dom/x-path-ns-resolver) |
| [XPathResult](/docs/hero/awaited-dom/x-path-result) |  |


## Miscellaneous Interfaces

|     |     |
| --- | --- |
| [Attr](/docs/hero/awaited-dom/attr) | [CharacterData](/docs/hero/awaited-dom/character-data) |
| [EventTarget](/docs/hero/awaited-dom/event-target) | [Request](/docs/hero/awaited-dom/request) |
| [Response](/docs/hero/awaited-dom/response) | [Storage](/docs/hero/awaited-dom/storage) |

