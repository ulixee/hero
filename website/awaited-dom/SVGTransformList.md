# SVGTransformList

<div class='overview'>The <code>SVGTransformList</code> defines a list of <a href="/en-US/docs/Web/API/SVGTransform" title="SVGTransform is the interface for one of the component transformations within an SVGTransformList; thus, an SVGTransform object corresponds to a single component (e.g., scale(…) or matrix(…)) within a transform attribute."><code>SVGTransform</code></a> objects.</div>

<div class='overview'>An <code>SVGTransformList</code> object can be designated as read only, which means that attempts to modify the object will result in an exception being thrown.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

The number of items in the list.

#### **Type**: `null`

### .numberOfItems <div class="specs"><i>W3C</i></div> {#numberOfItems}

The number of items in the list.

#### **Type**: `null`

## Methods

### .appendItem*(...args)* <div class="specs"><i>W3C</i></div> {#appendItem}

<p>Inserts a new item at the end of the list. If <code>newItem</code> is already in a list, it is removed from its previous list before it is inserted into this list. The inserted item is the item itself and not a copy.</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the list corresponds to a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .clear*(...args)* <div class="specs"><i>W3C</i></div> {#clear}

<p>Clears all existing current items from the list, with the result being an empty list.</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the list corresponds to a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .consolidate*(...args)* <div class="specs"><i>W3C</i></div> {#consolidate}

<p>Consolidates the list of separate <code>SVGTransform</code> objects by multiplying the equivalent transformation matrices together to result in a list consisting of a single <code>SVGTransform</code> object of type <code>SVG_TRANSFORM_MATRIX</code>. The consolidation operation creates new <code>SVGTransform</code> object as the first and only item in the list. The returned item is the item itself and not a copy. Any changes made to the item are immediately reflected in the list.</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the list corresponds to a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .createSVGTransformFromMatrix*(...args)* <div class="specs"><i>W3C</i></div> {#createSVGTransformFromMatrix}

Creates an <code>SVGTransform</code> object which is initialized to transform of type <code>SVG_TRANSFORM_MATRIX</code> and whose values are the given matrix. The values from the parameter matrix are copied, the matrix parameter is not adopted as <code>SVGTransform::matrix</code>.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .getItem*(...args)* <div class="specs"><i>W3C</i></div> {#getItem}

<p>Returns the specified item from the list. The returned item is the item itself and not a copy. Any changes made to the item are immediately reflected in the list. The first item is number&nbsp;0.</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the list corresponds to a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .initialize*(...args)* <div class="specs"><i>W3C</i></div> {#initialize}

<p>Clears all existing current items from the list and re-initializes the list to hold the single item specified by the parameter. If the inserted item is already in a list, it is removed from its previous list before it is inserted into this list. The inserted item is the item itself and not a copy. The return value is the item inserted into the list.</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the list corresponds to a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .insertItemBefore*(...args)* <div class="specs"><i>W3C</i></div> {#insertItemBefore}

<p>Inserts a new item into the list at the specified position. The first item is number 0. If <code>newItem</code> is already in a list, it is removed from its previous list before it is inserted into this list. The inserted item is the item itself and not a copy. If the item is already in this list, note that the index of the item to insert before is before the removal of the item. If the <code>index</code> is equal to 0, then the new item is inserted at the front of the list. If the index is greater than or equal to <code>numberOfItems</code>, then the new item is appended to the end of the list.</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the list corresponds to a read only attribute or when the object itself is read only.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .removeItem*(...args)* <div class="specs"><i>W3C</i></div> {#removeItem}

<p>Removes an existing item from the list.</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the list corresponds to a read only attribute or when the object itself is read only.</li>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>INDEX_SIZE_ERR</code> is raised if the index number is greater than or equal to <code>numberOfItems</code>.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .replaceItem*(...args)* <div class="specs"><i>W3C</i></div> {#replaceItem}

<p>Replaces an existing item in the list with a new item. If <code>newItem</code> is already in a list, it is removed from its previous list before it is inserted into this list. The inserted item is the item itself and not a copy. If the item is already in this list, note that the index of the item to replace is before the removal of the item.</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the list corresponds to a read only attribute or when the object itself is read only.</li>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>INDEX_SIZE_ERR</code> is raised if the index number is greater than or equal to <code>numberOfItems</code>.</li>
    </ul>

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

## Events
