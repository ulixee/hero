# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> SuperNode

<div class='overview'><span class="seoSummary"><strong><code>Node</code></strong> is an interface from which various types of DOM API objects inherit, allowing those types to be treated similarly; for example, inheriting the same set of methods, or being testable in the same way.</span></div>

<div class='overview'>All of the following interfaces inherit the <code>Node</code> interface's methods and properties: <a href="/en-US/docs/Web/API/Document" title="The Document interface represents any web page loaded in the browser and serves as an entry point into the web page's content, which is the DOM tree."><code>Document</code></a>, <a href="/en-US/docs/Web/API/Element" title="Element is the most general base class from which all element objects (i.e. objects that represent elements) in a Document inherit. It only has methods and properties common to all kinds of elements. More specific classes inherit from Element."><code>Element</code></a>, <a href="/en-US/docs/Web/API/Attr" title="The Attr interface represents one of a DOM element's attributes as an object. In most DOM methods, you will directly retrieve the attribute as a string (e.g., Element.getAttribute()), but certain functions (e.g., Element.getAttributeNode()) or means of iterating return Attr types."><code>Attr</code></a>, <a href="/en-US/docs/Web/API/CharacterData" title="The CharacterData abstract interface represents a Node object that contains characters. This is an abstract interface, meaning there aren't any object of type CharacterData: it is implemented by other interfaces, like Text, Comment, or ProcessingInstruction which aren't abstract."><code>CharacterData</code></a> (which <a href="/en-US/docs/Web/API/Text" title="The Text interface represents the textual content of Element or Attr. If an element has no markup within its content, it has a single child implementing Text that contains the element's text. However, if the element contains markup, it is parsed into information items and Text nodes that form its children."><code>Text</code></a>, <a href="/en-US/docs/Web/API/Comment" title="The Comment interface represents textual notations within markup; although it is generally not visually shown, such comments are available to be read in the source view."><code>Comment</code></a>, and <a href="/en-US/docs/Web/API/CDATASection" title="The CDATASection interface represents a CDATA section that can be used within XML to include extended portions of unescaped text. The symbols < and &amp; don’t need escaping as they normally do when inside a CDATA section."><code>CDATASection</code></a> inherit), <a href="/en-US/docs/Web/API/ProcessingInstruction" title="The ProcessingInstruction interface represents a processing instruction; that is, a Node which embeds an instruction targeting a specific application but that can be ignored by any other applications which don't recognize the instruction."><code>ProcessingInstruction</code></a>, <a href="/en-US/docs/Web/API/DocumentFragment" title="The DocumentFragment interface represents a minimal document object that has no parent. It is used as a lightweight version of Document that stores a segment of a document structure comprised of nodes just like a standard document."><code>DocumentFragment</code></a>, <a href="/en-US/docs/Web/API/DocumentType" title="The DocumentType interface represents a Node containing a doctype."><code>DocumentType</code></a>, <a href="/en-US/docs/Web/API/Notation" title="Represents a DTD notation (read-only). May declare format of an unparsed entity or formally declare the document's processing instruction targets. Inherits methods and properties from Node. Its nodeName is the notation name. Has no parent."><code>Notation</code></a>, <a class="new" href="/en-US/docs/Web/API/Entity" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>Entity</code></a>, <a class="new" href="/en-US/docs/Web/API/EntityReference" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>EntityReference</code></a></div>

<div class='overview'>Those interfaces may return <code>null</code> in certain cases where the methods and properties are not relevant. They may throw an exception — for example when adding children to a node type for which no children can exist.</div>

## Dependencies


SuperNode implements all the properties and methods of the following classes:

 |   |   | 
 | --- | --- | 
 | [Animatable](./animatable) | [Attr](./attr)
[CDATASection](./cdata-section) | [CharacterData](./character-data)
[ChildNode](./child-node) | [Comment](./comment)
[Document](./document) | [DocumentAndElementEventHandlers](./document-and-element-event-handlers)
[DocumentFragment](./document-fragment) | [DocumentOrShadowRoot](./document-or-shadow-root)
[DocumentType](./document-type) | [Element](./element)
[ElementContentEditable](./element-content-editable) | [ElementCSSInlineStyle](./element-css-inline-style)
[EventTarget](./event-target) | [FontFaceSource](./font-face-source)
[GlobalEventHandlers](./global-event-handlers) | [HTMLAnchorElement](./html-anchor-element)
[HTMLAreaElement](./html-area-element) | [HTMLAudioElement](./html-audio-element)
[HTMLBaseElement](./html-base-element) | [HTMLBodyElement](./html-body-element)
[HTMLBRElement](./htmlbr-element) | [HTMLButtonElement](./html-button-element)
[HTMLCanvasElement](./html-canvas-element) | [HTMLDataElement](./html-data-element)
[HTMLDataListElement](./html-data-list-element) | [HTMLDetailsElement](./html-details-element)
[HTMLDialogElement](./html-dialog-element) | [HTMLDirectoryElement](./html-directory-element)
[HTMLDivElement](./html-div-element) | [HTMLDListElement](./htmld-list-element)
[HTMLDocument](./html-document) | [HTMLElement](./html-element)
[HTMLEmbedElement](./html-embed-element) | [HTMLFieldSetElement](./html-field-set-element)
[HTMLFontElement](./html-font-element) | [HTMLFormElement](./html-form-element)
[HTMLFrameElement](./html-frame-element) | [HTMLFrameSetElement](./html-frame-set-element)
[HTMLHeadElement](./html-head-element) | [HTMLHeadingElement](./html-heading-element)
[HTMLHRElement](./htmlhr-element) | [HTMLHtmlElement](./html-html-element)
[HTMLHyperlinkElementUtils](./html-hyperlink-element-utils) | [HTMLIFrameElement](./htmli-frame-element)
[HTMLImageElement](./html-image-element) | [HTMLInputElement](./html-input-element)
[HTMLLabelElement](./html-label-element) | [HTMLLegendElement](./html-legend-element)
[HTMLLIElement](./htmlli-element) | [HTMLLinkElement](./html-link-element)
[HTMLMapElement](./html-map-element) | [HTMLMarqueeElement](./html-marquee-element)
[HTMLMediaElement](./html-media-element) | [HTMLMenuElement](./html-menu-element)
[HTMLMetaElement](./html-meta-element) | [HTMLMeterElement](./html-meter-element)
[HTMLModElement](./html-mod-element) | [HTMLObjectElement](./html-object-element)
[HTMLOListElement](./htmlo-list-element) | [HTMLOptGroupElement](./html-opt-group-element)
[HTMLOptionElement](./html-option-element) | [HTMLOrSVGElement](./html-or-svg-element)
[HTMLOutputElement](./html-output-element) | [HTMLParagraphElement](./html-paragraph-element)
[HTMLParamElement](./html-param-element) | [HTMLPictureElement](./html-picture-element)
[HTMLPreElement](./html-pre-element) | [HTMLProgressElement](./html-progress-element)
[HTMLQuoteElement](./html-quote-element) | [HTMLScriptElement](./html-script-element)
[HTMLSelectElement](./html-select-element) | [HTMLSlotElement](./html-slot-element)
[HTMLSourceElement](./html-source-element) | [HTMLSpanElement](./html-span-element)
[HTMLStyleElement](./html-style-element) | [HTMLTableCaptionElement](./html-table-caption-element)
[HTMLTableCellElement](./html-table-cell-element) | [HTMLTableColElement](./html-table-col-element)
[HTMLTableElement](./html-table-element) | [HTMLTableRowElement](./html-table-row-element)
[HTMLTableSectionElement](./html-table-section-element) | [HTMLTemplateElement](./html-template-element)
[HTMLTextAreaElement](./html-text-area-element) | [HTMLTimeElement](./html-time-element)
[HTMLTitleElement](./html-title-element) | [HTMLTrackElement](./html-track-element)
[HTMLUListElement](./htmlu-list-element) | [HTMLUnknownElement](./html-unknown-element)
[HTMLVideoElement](./html-video-element) | [LinkStyle](./link-style)
[Node](./node) | [NonDocumentTypeChildNode](./non-document-type-child-node)
[NonElementParentNode](./non-element-parent-node) | [ParentNode](./parent-node)
[ProcessingInstruction](./processing-instruction) | [ShadowRoot](./shadow-root)
[Slotable](./slotable) | [SVGElement](./svg-element)
[SVGGraphicsElement](./svg-graphics-element) | [SVGSVGElement](./svgsvg-element)
[SVGTests](./svg-tests) | [SVGTitleElement](./svg-title-element)
[Text](./text) | [WindowEventHandlers](./window-event-handlers)
[XMLDocument](./xml-document) | [XPathEvaluatorBase](./x-path-evaluator-base) | 
