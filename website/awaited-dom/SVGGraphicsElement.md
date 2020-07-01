# SVGGraphicsElement

<div class='overview'>The <strong><code>SVGGraphicsElement</code></strong> interface represents SVG elements whose primary purpose is to directly render graphics into a group.</div>

## Properties

### .transform <div class="specs"><i>W3C</i></div> {#transform}

An&nbsp;<a href="/en-US/docs/Web/API/SVGAnimatedTransformList" title="The SVGAnimatedTransformList interface is used for attributes which take a list of numbers and which can be animated."><code>SVGAnimatedTransformList</code></a> reflecting the computed value of the <a href="/en-US/docs/Web/CSS/transform" title="The transform CSS property lets you rotate, scale, skew, or translate an element. It modifies the coordinate space of the CSS visual formatting model."><code>transform</code></a> property and its corresponding <code><a href="/en-US/docs/Web/SVG/Attribute/transform">transform</a></code> attribute of the given element.

#### **Type**: `null`

## Methods

### .getBBox*(...args)* <div class="specs"><i>W3C</i></div> {#getBBox}

Returns a <a href="/en-US/docs/Web/API/DOMRect" title="A DOMRect represents a rectangle."><code>DOMRect</code></a> representing the computed bounding box of the current element.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getCTM*(...args)* <div class="specs"><i>W3C</i></div> {#getCTM}

Returns a <a href="/en-US/docs/Web/API/DOMMatrix" title="The DOMMatrix interface represents 4x4 matrices, suitable for 2D and 3D operations including rotation and translation. It is a mutable version of the DOMMatrixReadOnly interface."><code>DOMMatrix</code></a> representing the matrix that transforms the current element's coordinate system to its SVG viewport's coordinate system.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getScreenCTM*(...args)* <div class="specs"><i>W3C</i></div> {#getScreenCTM}

Returns a <a href="/en-US/docs/Web/API/DOMMatrix" title="The DOMMatrix interface represents 4x4 matrices, suitable for 2D and 3D operations including rotation and translation. It is a mutable version of the DOMMatrixReadOnly interface."><code>DOMMatrix</code></a> representing the matrix that transforms the current element's coordinate system to the coordinate system of the SVG viewport for the SVG document fragment.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

## Events
