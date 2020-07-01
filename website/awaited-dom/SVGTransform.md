# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> SVGTransform

<div class='overview'><code>SVGTransform</code> is the interface for one of the component transformations within an <a href="/en-US/docs/Web/API/SVGTransformList" title="The SVGTransformList defines a list of SVGTransform objects."><code>SVGTransformList</code></a>; thus, an <code>SVGTransform</code> object corresponds to a single component (e.g., <code>scale(…)</code> or <code>matrix(…)</code>) within a <code><a href="/en-US/docs/Web/SVG/Attribute/transform">transform</a></code> attribute.</div>

<div class='overview'>An <code>SVGTransform</code> object can be designated as read only, which means that attempts to modify the object will result in an exception being thrown.</div>

## Properties

### .angle <div class="specs"><i>W3C</i></div> {#angle}

A convenience attribute for <code>SVG_TRANSFORM_ROTATE</code>, <code>SVG_TRANSFORM_SKEWX</code> and <code>SVG_TRANSFORM_SKEWY</code>. It holds the angle that was specified.
<br>
    <br>
    For <code>SVG_TRANSFORM_MATRIX</code>, <code>SVG_TRANSFORM_TRANSLATE</code> and <code>SVG_TRANSFORM_SCALE</code>, <code>angle</code> will be zero.

#### **Type**: `null`

### .matrix <div class="specs"><i>W3C</i></div> {#matrix}

<p>The matrix that represents this transformation. The matrix object is live, meaning that any changes made to the <code>SVGTransform</code> object are immediately reflected in the matrix object and vice versa. In case the matrix object is changed directly (i.e., without using the methods on the <code>SVGTransform</code> interface itself) then the type of the <code>SVGTransform</code> changes to <code>SVG_TRANSFORM_MATRIX</code>.
</p>
    <ul>
     <li>For <code>SVG_TRANSFORM_MATRIX</code>, the matrix contains the a, b, c, d, e, f values supplied by the user.</li>
     <li>For <code>SVG_TRANSFORM_TRANSLATE</code>, e and f represent the translation amounts (a=1, b=0, c=0 and d=1).</li>
     <li>For <code>SVG_TRANSFORM_SCALE</code>, a and d represent the scale amounts (b=0, c=0, e=0 and f=0).</li>
     <li>For <code>SVG_TRANSFORM_SKEWX</code> and <code>SVG_TRANSFORM_SKEWY</code>, a, b, c and d represent the matrix which will result in the given skew (e=0 and f=0).</li>
     <li>For <code>SVG_TRANSFORM_ROTATE</code>, a, b, c, d, e and f together represent the matrix which will result in the given rotation. When the rotation is around the center point (0, 0), e and f will be zero.</li>
    </ul>

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

The type of the value as specified by one of the SVG_TRANSFORM_* constants defined on this interface.

#### **Type**: `null`

## Methods

### .setMatrix*(...args)* <div class="specs"><i>W3C</i></div> {#setMatrix}

<p>Sets the transform type to <code>SVG_TRANSFORM_MATRIX</code>, with parameter matrix defining the new transformation. Note that the values from the parameter <code>matrix</code> are copied.
</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when attempting to modify a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setRotate*(...args)* <div class="specs"><i>W3C</i></div> {#setRotate}

<p>Sets the transform type to <code>SVG_TRANSFORM_ROTATE</code>, with parameter <code>angle</code> defining the rotation angle and parameters <code>cx</code> and <code>cy</code> defining the optional center of rotation.
</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when attempting to modify a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setScale*(...args)* <div class="specs"><i>W3C</i></div> {#setScale}

<p>Sets the transform type to <code>SVG_TRANSFORM_SCALE</code>, with parameters <code>sx</code> and <code>sy</code> defining the scale amounts.
</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when attempting to modify a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setSkewX*(...args)* <div class="specs"><i>W3C</i></div> {#setSkewX}

<p>Sets the transform type to <code>SVG_TRANSFORM_SKEWX</code>, with parameter <code>angle</code> defining the amount of skew.
</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when attempting to modify a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setSkewY*(...args)* <div class="specs"><i>W3C</i></div> {#setSkewY}

<p>Sets the transform type to <code>SVG_TRANSFORM_SKEWY</code>, with parameter <code>angle</code> defining the amount of skew.
</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when attempting to modify a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .setTranslate*(...args)* <div class="specs"><i>W3C</i></div> {#setTranslate}

<p>Sets the transform type to <code>SVG_TRANSFORM_TRANSLATE</code>, with parameters <code>tx</code> and <code>ty</code> defining the translation amounts.
</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when attempting to modify a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`
