# SVGLength

<div class='overview'>The <code>SVGLength</code> interface correspond to the <a href="/en/SVG/Content_type#Length" title="https://developer.mozilla.org/en/SVG/Content_type#Length">&lt;length&gt;</a> basic data type.</div>

<div class='overview'>An <code>SVGLength</code> object can be designated as read only, which means that attempts to modify the object will result in an exception being thrown.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">unitType</a>
    <div>The type of the value as specified by one of the SVG_LENGTHTYPE_* constants defined on this interface.</div>
  </li>
  <li>
    <a href="">value</a>
    <div><p>The value as a floating point value, in user units. Setting this attribute will cause <code>valueInSpecifiedUnits</code> and <code>valueAsString</code> to be updated automatically to reflect this setting.</p>
    <p><strong>Exceptions on setting:</strong> a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the length corresponds to a read only attribute or when the object itself is read only.</p></div>
  </li>
  <li>
    <a href="">valueAsString</a>
    <div><p>The value as a string value, in the units expressed by <code>unitType</code>. Setting this attribute will cause <code>value</code>, <code>valueInSpecifiedUnits</code> and <code>unitType</code> to be updated automatically to reflect this setting.</p>
    <p><strong>Exceptions on setting:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>SYNTAX_ERR</code> is raised if the assigned string cannot be parsed as a valid <a href="/en/SVG/Content_type#Length" title="https://developer.mozilla.org/en/SVG/Content_type#Length">&lt;length&gt;</a>.</li>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the length corresponds to a read only attribute or when the object itself is read only.</li>
    </ul></div>
  </li>
  <li>
    <a href="">valueInSpecifiedUnits</a>
    <div><p>The value as a floating point value, in the units expressed by <code>unitType</code>. Setting this attribute will cause <code>value</code> and <code>valueAsString</code> to be updated automatically to reflect this setting.</p>
    <p><strong>Exceptions on setting:</strong> a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the length corresponds to a read only attribute or when the object itself is read only.</p></div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">convertToSpecifiedUnits()</a>
    <div>Preserve the same underlying stored value, but reset the stored unit identifier to the given <code><em>unitType</em></code>. Object attributes <code>unitType</code>, <code>valueInSpecifiedUnits</code> and <code>valueAsString</code> might be modified as a result of this method. For example, if the original value were "<em>0.5cm</em>" and the method was invoked to convert to millimeters, then the <code>unitType</code> would be changed to <code>SVG_LENGTHTYPE_MM</code>, <code>valueInSpecifiedUnits</code> would be changed to the numeric value 5 and <code>valueAsString</code> would be changed to "<em>5mm</em>".</div>
  </li>
  <li>
    <a href="">newValueSpecifiedUnits()</a>
    <div><p>Reset the value as a number with an associated unitType, thereby replacing the values for all of the attributes on the object.</p>
    <p><strong>Exceptions:</strong></p>
    <ul>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NOT_SUPPORTED_ERR</code> is raised if <code>unitType</code> is <code>SVG_LENGTHTYPE_UNKNOWN</code> or not a valid unit type constant (one of the other <code>SVG_LENGTHTYPE_*</code> constants defined on this interface).</li>
     <li>a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with code <code>NO_MODIFICATION_ALLOWED_ERR</code> is raised when the length corresponds to a read only attribute or when the object itself is read only.</li>
    </ul></div>
  </li>
</ul>

## Events
