# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> SuperNode

<div class='overview'><span class="seoSummary"><strong><code>Node</code></strong> is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way.</span></div>

<div class='overview'>All of the following interfaces inherit the <code>Node</code> interface's methods and properties: <code>Document</code>, <code>Element</code>, <code>Attr</code>, <code>CharacterData</code> (which <code>Text</code>, <code>Comment</code>, and <code>CDATASection</code> inherit), <code>ProcessingInstruction</code>, <code>DocumentFragment</code>, <code>DocumentType</code>, <code>Notation</code>, <code>Entity</code>, <code>EntityReference</code></div>

<div class='overview'>Those interfaces may return <code>null</code> in certain cases where the methods and properties are not relevant. They may throw an exception — for example when adding children to a node type for which no children can exist.</div>

## Dependencies


SuperNode implements all the properties and methods of the following classes:

|     |     |
| --- | --- |
| [Attr](./attr.md) | [CDATASection](./cdata-section.md) |
| [CharacterData](./character-data.md) | [Comment](./comment.md) |
| [Document](./document.md) | [DocumentFragment](./document-fragment.md) |
| [DocumentType](./document-type.md) | [Element](./element.md) |
| [EventTarget](./event-target.md) | [HTMLAnchorElement](./html-anchor-element.md) |
| [HTMLAreaElement](./html-area-element.md) | [HTMLAudioElement](./html-audio-element.md) |
| [HTMLBaseElement](./html-base-element.md) | [HTMLBodyElement](./html-body-element.md) |
| [HTMLBRElement](./html-br-element.md) | [HTMLButtonElement](./html-button-element.md) |
| [HTMLCanvasElement](./html-canvas-element.md) | [HTMLDataElement](./html-data-element.md) |
| [HTMLDataListElement](./html-data-list-element.md) | [HTMLDetailsElement](./html-details-element.md) |
| [HTMLDialogElement](./html-dialog-element.md) | [HTMLDivElement](./html-div-element.md) |
| [HTMLDListElement](./html-d-list-element.md) | [HTMLDocument](./html-document.md) |
| [HTMLElement](./html-element.md) | [HTMLEmbedElement](./html-embed-element.md) |
| [HTMLFieldSetElement](./html-field-set-element.md) | [HTMLFontElement](./html-font-element.md) |
| [HTMLFormElement](./html-form-element.md) | [HTMLFrameSetElement](./html-frame-set-element.md) |
| [HTMLHeadElement](./html-head-element.md) | [HTMLHeadingElement](./html-heading-element.md) |
| [HTMLHRElement](./html-hr-element.md) | [HTMLHtmlElement](./html-html-element.md) |
| [HTMLIFrameElement](./html-iframe-element.md) | [HTMLImageElement](./html-image-element.md) |
| [HTMLInputElement](./html-input-element.md) | [HTMLLabelElement](./html-label-element.md) |
| [HTMLLegendElement](./html-legend-element.md) | [HTMLLIElement](./html-li-element.md) |
| [HTMLLinkElement](./html-link-element.md) | [HTMLMapElement](./html-map-element.md) |
| [HTMLMarqueeElement](./html-marquee-element.md) | [HTMLMediaElement](./html-media-element.md) |
| [HTMLMenuElement](./html-menu-element.md) | [HTMLMetaElement](./html-meta-element.md) |
| [HTMLMeterElement](./html-meter-element.md) | [HTMLModElement](./html-mod-element.md) |
| [HTMLObjectElement](./html-object-element.md) | [HTMLOListElement](./html-o-list-element.md) |
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
| [HTMLVideoElement](./html-video-element.md) | [Node](./node.md) |
| [ProcessingInstruction](./processing-instruction.md) | [ShadowRoot](./shadow-root.md) |
| [SVGElement](./svg-element.md) | [SVGGraphicsElement](./svg-graphics-element.md) |
| [SVGSVGElement](./svgsvg-element.md) | [SVGTitleElement](./svg-title-element.md) |
| [Text](./text.md) | [XMLDocument](./xml-document.md) |
