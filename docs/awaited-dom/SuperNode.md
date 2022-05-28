# [AwaitedDOM](/docs/basic-client/awaited-dom) <span>/</span> SuperNode

<div class='overview'><span class="seoSummary"><strong><code>Node</code></strong> is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way.</span></div>

<div class='overview'>All of the following interfaces inherit the <code>Node</code> interface's methods and properties: <code>Document</code>, <code>Element</code>, <code>Attr</code>, <code>CharacterData</code> (which <code>Text</code>, <code>Comment</code>, and <code>CDATASection</code> inherit), <code>ProcessingInstruction</code>, <code>DocumentFragment</code>, <code>DocumentType</code>, <code>Notation</code>, <code>Entity</code>, <code>EntityReference</code></div>

<div class='overview'>Those interfaces may return <code>null</code> in certain cases where the methods and properties are not relevant. They may throw an exception — for example when adding children to a node type for which no children can exist.</div>

## Dependencies


SuperNode implements all the properties and methods of the following classes:

|     |     |
| --- | --- |
| [Attr](./attr) | [CDATASection](./cdata-section) |
| [CharacterData](./character-data) | [Comment](./comment) |
| [Document](./document) | [DocumentFragment](./document-fragment) |
| [DocumentType](./document-type) | [Element](./element) |
| [EventTarget](./event-target) | [HTMLAnchorElement](./html-anchor-element) |
| [HTMLAreaElement](./html-area-element) | [HTMLAudioElement](./html-audio-element) |
| [HTMLBaseElement](./html-base-element) | [HTMLBodyElement](./html-body-element) |
| [HTMLBRElement](./htmlbr-element) | [HTMLButtonElement](./html-button-element) |
| [HTMLCanvasElement](./html-canvas-element) | [HTMLDataElement](./html-data-element) |
| [HTMLDataListElement](./html-data-list-element) | [HTMLDetailsElement](./html-details-element) |
| [HTMLDialogElement](./html-dialog-element) | [HTMLDirectoryElement](./html-directory-element) |
| [HTMLDivElement](./html-div-element) | [HTMLDListElement](./htmld-list-element) |
| [HTMLDocument](./html-document) | [HTMLElement](./html-element) |
| [HTMLEmbedElement](./html-embed-element) | [HTMLFieldSetElement](./html-field-set-element) |
| [HTMLFontElement](./html-font-element) | [HTMLFormElement](./html-form-element) |
| [HTMLFrameElement](./html-frame-element) | [HTMLFrameSetElement](./html-frame-set-element) |
| [HTMLHeadElement](./html-head-element) | [HTMLHeadingElement](./html-heading-element) |
| [HTMLHRElement](./htmlhr-element) | [HTMLHtmlElement](./html-html-element) |
| [HTMLIFrameElement](./htmli-frame-element) | [HTMLImageElement](./html-image-element) |
| [HTMLInputElement](./html-input-element) | [HTMLLabelElement](./html-label-element) |
| [HTMLLegendElement](./html-legend-element) | [HTMLLIElement](./htmlli-element) |
| [HTMLLinkElement](./html-link-element) | [HTMLMapElement](./html-map-element) |
| [HTMLMarqueeElement](./html-marquee-element) | [HTMLMediaElement](./html-media-element) |
| [HTMLMenuElement](./html-menu-element) | [HTMLMetaElement](./html-meta-element) |
| [HTMLMeterElement](./html-meter-element) | [HTMLModElement](./html-mod-element) |
| [HTMLObjectElement](./html-object-element) | [HTMLOListElement](./htmlo-list-element) |
| [HTMLOptGroupElement](./html-opt-group-element) | [HTMLOptionElement](./html-option-element) |
| [HTMLOutputElement](./html-output-element) | [HTMLParagraphElement](./html-paragraph-element) |
| [HTMLParamElement](./html-param-element) | [HTMLPictureElement](./html-picture-element) |
| [HTMLPreElement](./html-pre-element) | [HTMLProgressElement](./html-progress-element) |
| [HTMLQuoteElement](./html-quote-element) | [HTMLScriptElement](./html-script-element) |
| [HTMLSelectElement](./html-select-element) | [HTMLSlotElement](./html-slot-element) |
| [HTMLSourceElement](./html-source-element) | [HTMLSpanElement](./html-span-element) |
| [HTMLStyleElement](./html-style-element) | [HTMLTableCaptionElement](./html-table-caption-element) |
| [HTMLTableCellElement](./html-table-cell-element) | [HTMLTableColElement](./html-table-col-element) |
| [HTMLTableElement](./html-table-element) | [HTMLTableRowElement](./html-table-row-element) |
| [HTMLTableSectionElement](./html-table-section-element) | [HTMLTemplateElement](./html-template-element) |
| [HTMLTextAreaElement](./html-text-area-element) | [HTMLTimeElement](./html-time-element) |
| [HTMLTitleElement](./html-title-element) | [HTMLTrackElement](./html-track-element) |
| [HTMLUListElement](./htmlu-list-element) | [HTMLUnknownElement](./html-unknown-element) |
| [HTMLVideoElement](./html-video-element) | [Node](./node) |
| [ProcessingInstruction](./processing-instruction) | [ShadowRoot](./shadow-root) |
| [SVGElement](./svg-element) | [SVGGraphicsElement](./svg-graphics-element) |
| [SVGSVGElement](./svgsvg-element) | [SVGTitleElement](./svg-title-element) |
| [Text](./text) | [XMLDocument](./xml-document) |
