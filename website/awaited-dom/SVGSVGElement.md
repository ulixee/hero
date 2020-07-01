# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> SVGSVGElement

<div class='overview'>The <strong><code>SVGSVGElement</code></strong> interface provides access to the properties of <a href="/en-US/docs/Web/SVG/Element/svg" title="The svg element is a container that defines a new coordinate system and viewport. It is used as the outermost element of SVG documents, but it can also be used to embed a SVG fragment inside an SVG or HTML document."><code>&lt;svg&gt;</code></a> elements, as well as methods to manipulate them. This interface contains also various miscellaneous commonly-used utility methods, such as matrix operations and the ability to control the time of redraw on visual rendering devices.</div>

## Properties

### .currentScale <div class="specs"><i>W3C</i></div> {#currentScale}

On an outermost <a href="/en-US/docs/Web/SVG/Element/svg" title="The svg element is a container that defines a new coordinate system and viewport. It is used as the outermost element of SVG documents, but it can also be used to embed a SVG fragment inside an SVG or HTML document."><code>&lt;svg&gt;</code></a> element, this float attribute indicates the current scale factor relative to the initial view to take into account user magnification and panning operations. DOM attributes <code>currentScale</code> and <code>currentTranslate</code> are equivalent to the 2x3 matrix <code>[a b c d e f] = [currentScale 0 0 currentScale currentTranslate.x currentTranslate.y]</code>. If "magnification" is enabled (i.e., <code>zoomAndPan="magnify"</code>), then the effect is as if an extra transformation were placed at the outermost level on the SVG document fragment (i.e., outside the outermost <a href="/en-US/docs/Web/SVG/Element/svg" title="The svg element is a container that defines a new coordinate system and viewport. It is used as the outermost element of SVG documents, but it can also be used to embed a SVG fragment inside an SVG or HTML document."><code>&lt;svg&gt;</code>
</a> element).

#### **Type**: `null`

### .currentTranslate <div class="specs"><i>W3C</i></div> {#currentTranslate}

An <a href="/en-US/docs/Web/API/SVGPoint" title="An SVGPoint represents a 2D or 3D point in the SVG coordinate system."><code>SVGPoint</code></a> representing the translation factor that takes into account user "magnification" corresponding to an outermost <a href="/en-US/docs/Web/SVG/Element/svg" title="The svg element is a container that defines a new coordinate system and viewport. It is used as the outermost element of SVG documents, but it can also be used to embed a SVG fragment inside an SVG or HTML document."><code>&lt;svg&gt;</code>
</a> element. The behavior is undefined for &lt;svg&gt; elements that are not at the outermost level.

#### **Type**: `null`

### .height <div class="specs"><i>W3C</i></div> {#height}

An <a href="/en-US/docs/Web/API/SVGAnimatedLength" title="The SVGAnimatedLength interface is used for attributes of basic type <length> which can be animated."><code>SVGAnimatedLength</code></a> corresponding to the <code><a href="/en-US/docs/Web/SVG/Attribute/height">height</a></code> attribute of the given <a href="/en-US/docs/Web/SVG/Element/svg" title="The svg element is a container that defines a new coordinate system and viewport. It is used as the outermost element of SVG documents, but it can also be used to embed a SVG fragment inside an SVG or HTML document."><code>&lt;svg&gt;</code>
</a> element.

#### **Type**: `null`

### .width <div class="specs"><i>W3C</i></div> {#width}

An <a href="/en-US/docs/Web/API/SVGAnimatedLength" title="The SVGAnimatedLength interface is used for attributes of basic type <length> which can be animated."><code>SVGAnimatedLength</code></a> corresponding to the <code><a href="/en-US/docs/Web/SVG/Attribute/width">width</a></code> attribute of the given <a href="/en-US/docs/Web/SVG/Element/svg" title="The svg element is a container that defines a new coordinate system and viewport. It is used as the outermost element of SVG documents, but it can also be used to embed a SVG fragment inside an SVG or HTML document."><code>&lt;svg&gt;</code>
</a> element.

#### **Type**: `null`

### .x <div class="specs"><i>W3C</i></div> {#x}

An <a href="/en-US/docs/Web/API/SVGAnimatedLength" title="The SVGAnimatedLength interface is used for attributes of basic type <length> which can be animated."><code>SVGAnimatedLength</code></a> corresponding to the <code><a href="/en-US/docs/Web/SVG/Attribute/x">x</a></code> attribute of the given <a href="/en-US/docs/Web/SVG/Element/svg" title="The svg element is a container that defines a new coordinate system and viewport. It is used as the outermost element of SVG documents, but it can also be used to embed a SVG fragment inside an SVG or HTML document."><code>&lt;svg&gt;</code>
</a> element.

#### **Type**: `null`

### .y <div class="specs"><i>W3C</i></div> {#y}

An <a href="/en-US/docs/Web/API/SVGAnimatedLength" title="The SVGAnimatedLength interface is used for attributes of basic type <length> which can be animated."><code>SVGAnimatedLength</code></a> corresponding to the <code><a href="/en-US/docs/Web/SVG/Attribute/y">y</a></code> attribute of the given <a href="/en-US/docs/Web/SVG/Element/svg" title="The svg element is a container that defines a new coordinate system and viewport. It is used as the outermost element of SVG documents, but it can also be used to embed a SVG fragment inside an SVG or HTML document."><code>&lt;svg&gt;</code>
</a> element.

#### **Type**: `null`

## Methods

### .checkEnclosure*(...args)* <div class="specs"><i>W3C</i></div> {#checkEnclosure}

Returns <code>true</code> if the rendered content of the given element is entirely contained within the supplied rectangle. Each candidate graphics element is to be considered a match only if the same graphics element can be a target of pointer events as defined in <code><a href="/en-US/docs/Web/SVG/Attribute/pointer-events">pointer-events</a>
</code> processing.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .checkIntersection*(...args)* <div class="specs"><i>W3C</i></div> {#checkIntersection}

Returns <code>true</code> if the rendered content of the given element intersects the supplied rectangle. Each candidate graphics element is to be considered a match only if the same graphics element can be a target of pointer events as defined in <code><a href="/en-US/docs/Web/SVG/Attribute/pointer-events">pointer-events</a>
</code> processing.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createSVGAngle*(...args)* <div class="specs"><i>W3C</i></div> {#createSVGAngle}

Creates an&nbsp;<a href="/en-US/docs/Web/API/SVGAngle" title="The SVGAngle interface is used to represent a value that can be an <angle> or <number> value. An SVGAngle reflected through the animVal attribute is always read only."><code>SVGAngle</code>
</a> object outside of any document trees. The object is initialized to a value of zero degrees (unitless).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createSVGLength*(...args)* <div class="specs"><i>W3C</i></div> {#createSVGLength}

Creates an&nbsp;<a href="/en-US/docs/Web/API/SVGLength" title="The SVGLength interface correspond to the <length> basic data type."><code>SVGLength</code>
</a> object outside of any document trees. The object is initialized to a value of zero user units.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createSVGMatrix*(...args)* <div class="specs"><i>W3C</i></div> {#createSVGMatrix}

Creates an&nbsp;<a href="/en-US/docs/Web/API/SVGMatrix" title="Many of SVG's graphics operations utilize 2x3 matrices of the form:"><code>SVGMatrix</code>
</a> object outside of any document trees. The object is initialized to the identity matrix.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createSVGNumber*(...args)* <div class="specs"><i>W3C</i></div> {#createSVGNumber}

Creates an <a href="/en-US/docs/Web/API/SVGNumber" title="The SVGNumber interface corresponds to the <number> basic data type."><code>SVGNumber</code>
</a> object outside of any document trees. The object is initialized to a value of zero.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createSVGPoint*(...args)* <div class="specs"><i>W3C</i></div> {#createSVGPoint}

Creates an&nbsp;<a href="/en-US/docs/Web/API/SVGPoint" title="An SVGPoint represents a 2D or 3D point in the SVG coordinate system."><code>SVGPoint</code>
</a> object outside of any document trees. The object is initialized to the point (0,0) in the user coordinate system.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createSVGRect*(...args)* <div class="specs"><i>W3C</i></div> {#createSVGRect}

Creates an&nbsp;<a href="/en-US/docs/Web/API/SVGRect" title="The SVGRect represents a rectangle. Rectangles consist&nbsp;of an x and y coordinate pair identifying a minimum x value, a minimum y value, and a width and height, which are constrained to be non-negative."><code>SVGRect</code>
</a> object outside of any document trees. The object is initialized such that all values are set to 0 user units.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createSVGTransform*(...args)* <div class="specs"><i>W3C</i></div> {#createSVGTransform}

Creates an&nbsp;<a href="/en-US/docs/Web/API/SVGTransform" title="SVGTransform is the interface for one of the component transformations within an SVGTransformList; thus, an SVGTransform object corresponds to a single component (e.g., scale(…) or matrix(…)) within a transform attribute."><code>SVGTransform</code></a> object outside of any document trees. The object is initialized to an identity matrix transform (<code>SVG_TRANSFORM_MATRIX
</code>).

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createSVGTransformFromMatrix*(...args)* <div class="specs"><i>W3C</i></div> {#createSVGTransformFromMatrix}

Creates an&nbsp;<a href="/en-US/docs/Web/API/SVGTransform" title="SVGTransform is the interface for one of the component transformations within an SVGTransformList; thus, an SVGTransform object corresponds to a single component (e.g., scale(…) or matrix(…)) within a transform attribute."><code>SVGTransform</code></a> object outside of any document trees. The object is initialized to the given matrix transform (i.e., <code>SVG_TRANSFORM_MATRIX</code>). The values from the parameter matrix are copied, the matrix parameter is not adopted as <code>SVGTransform::matrix
</code>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .deselectAll*(...args)* <div class="specs"><i>W3C</i></div> {#deselectAll}

Unselects any selected objects, including any selections of text strings and type-in bars.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .forceRedraw*(...args)* <div class="specs"><i>W3C</i></div> {#forceRedraw}

In rendering environments supporting interactivity, forces the user agent to immediately redraw all regions of the viewport that require updating.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getElementById*(...args)* <div class="specs"><i>W3C</i></div> {#getElementById}

Searches this SVG document fragment (i.e., the search is restricted to a subset of the document tree) for an Element whose id is given by <em>elementId
</em>. If an Element is found, that Element is returned. If no such element exists, returns null. Behavior is not defined if more than one element has this id.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getEnclosureList*(...args)* <div class="specs"><i>W3C</i></div> {#getEnclosureList}

Returns a <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> of graphics elements whose rendered content is entirely contained within the supplied rectangle. Each candidate graphics element is to be considered a match only if the same graphics element can be a target of pointer events as defined in <code><a href="/en-US/docs/Web/SVG/Attribute/pointer-events">pointer-events</a>
</code> processing.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getIntersectionList*(...args)* <div class="specs"><i>W3C</i></div> {#getIntersectionList}

Returns a <a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a> of graphics elements whose rendered content intersects the supplied rectangle. Each candidate graphics element is to be considered a match only if the same graphics element can be a target of pointer events as defined in <code><a href="/en-US/docs/Web/SVG/Attribute/pointer-events">pointer-events</a>
</code> processing.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .suspendRedraw*(...args)* <div class="specs"><i>W3C</i></div> {#suspendRedraw}


 <p>Takes a time-out value which indicates that redraw shall not occur until:</p>
 the corresponding unsuspendRedraw() call has been made, an unsuspendRedrawAll() call has been made, or its timer has timed out.
 <p>In environments that do not support interactivity (e.g., print media), then redraw shall not be suspended. Calls to <code>suspendRedraw()</code> and <code>unsuspendRedraw()</code> should, but need not be, made in balanced pairs.</p>
 <p>To suspend redraw actions as a collection of SVG DOM changes occur, precede the changes to the SVG DOM with a method call similar to:</p>
 <pre class="brush: js">suspendHandleID = suspendRedraw(maxWaitMilliseconds);</pre>
 <p>and follow the changes with a method call similar to:</p>
 <pre class="brush: js">unsuspendRedraw(suspendHandleID);</pre>
 <p>Note that multiple suspendRedraw calls can be used at once and that each such method call is treated independently of the other suspendRedraw method calls.</p>
 

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .unsuspendRedraw*(...args)* <div class="specs"><i>W3C</i></div> {#unsuspendRedraw}

Cancels a specified <code>suspendRedraw()</code> by providing a unique suspend handle ID that was returned by a previous <code>suspendRedraw()
</code> call.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .unsuspendRedrawAll*(...args)* <div class="specs"><i>W3C</i></div> {#unsuspendRedrawAll}

Cancels all currently active <code>suspendRedraw()</code> method calls. This method is most useful at the very end of a set of SVG DOM calls to ensure that all pending <code>suspendRedraw()
</code> method calls have been cancelled.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
