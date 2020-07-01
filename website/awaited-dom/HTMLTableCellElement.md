# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> HTMLTableCellElement

<div class='overview'>The <strong><code>HTMLTableCellElement</code></strong> interface provides special properties and methods (beyond the regular <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface it also has available to it by inheritance) for manipulating the layout and presentation of table cells, either header or data cells, in an HTML document.</div>

## Properties

### .abbr <div class="specs"><i>W3C</i></div> {#abbr}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> which can be used on <code>&lt;th&gt;</code> elements (not on <a href="/en-US/docs/Web/HTML/Element/td" title="The HTML <td> element defines a cell of a table that contains data. It participates in the table model."><code>&lt;td&gt;</code></a>), specifying an alternative label for the header cell.. This alternate label can be used in other contexts, such as when describing the headers that apply to a data cell. This is used to offer a shorter term for use by screen readers in particular, and is a valuable accessibility tool. Usually the value of <code>abbr
</code> is an abbreviation or acronym, but can be any text that's appropriate contextually.

#### **Type**: `null`

### .cellIndex <div class="specs"><i>W3C</i></div> {#cellIndex}

A long integer representing the cell's position in the <a class="new" href="/en-US/docs/Web/API/HTMLTableRowElement/cells" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>cells</code></a> collection of the <a href="/en-US/docs/Web/HTML/Element/tr" title="The HTML <tr> element defines a row of cells in a table. The row's cells can then be established using a mix of <td> (data cell) and <th> (header cell) elements."><code>&lt;tr&gt;</code></a> the cell is contained within. If the cell doesn't belong to a <code>&lt;tr&gt;</code>, it returns <code>-1
</code>.

#### **Type**: `null`

### .colSpan <div class="specs"><i>W3C</i></div> {#colSpan}

An unsigned long integer indicating the number of columns this cell must span; this lets the cell occupy space across multiple columns of the table. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/td#attr-colspan">colspan</a>
</code> attribute.

#### **Type**: `null`

### .headers <div class="specs"><i>W3C</i></div> {#headers}

Is a <a class="new" href="/en-US/docs/Web/API/DOMSettableTokenList" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>DOMSettableTokenList</code></a> describing a list of <code>id</code> of <a href="/en-US/docs/Web/HTML/Element/th" title="The HTML <th> element defines a cell as header of a group of table cells. The exact nature of this group is defined by the scope and headers attributes."><code>&lt;th&gt;</code></a> elements that represents headers associated with the cell. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/td#attr-headers">headers</a>
</code> attribute.

#### **Type**: `null`

### .rowSpan <div class="specs"><i>W3C</i></div> {#rowSpan}

An unsigned long integer indicating the number of rows this cell must span; this lets a cell occupy space across multiple rows of the table. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/td#attr-rowspan">rowspan</a>
</code> attribute.

#### **Type**: `null`

### .scope <div class="specs"><i>W3C</i></div> {#scope}

A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> indicating the scope of a <a href="/en-US/docs/Web/HTML/Element/th" title="The HTML <th> element defines a cell as header of a group of table cells. The exact nature of this group is defined by the scope and headers attributes."><code>&lt;th&gt;</code></a> cell. Header cells can be configured, using the <code>scope</code> property, the apply to a specified row or column, or to the not-yet-scoped cells within the current row group (that is, the same ancestor <a href="/en-US/docs/Web/HTML/Element/thead" title="The HTML <thead> element defines a set of rows defining the head of the columns of the table."><code>&lt;thead&gt;</code></a>, <a href="/en-US/docs/Web/HTML/Element/tbody" title="The HTML Table Body element (<tbody>) encapsulates a set of table rows (<tr> elements), indicating that they comprise the body of the table (<table>)."><code>&lt;tbody&gt;</code></a>, or <a href="/en-US/docs/Web/HTML/Element/tfoot" title="The HTML <tfoot> element defines a set of rows summarizing the columns of the table."><code>&lt;tfoot&gt;</code></a> element). If no value is specified for <code>scope</code>, the header is not associated directly with cells in this way. Permitted values for <code>scope
</code> are:
	<dl>
		<dt><code>col</code></dt>
		<dd>The header cell applies to the following cells in the same column (or columns, if <code>colspan</code> is used as well), until either the end of the column or another <code>&lt;th&gt;</code> in the column establishes a new scope.</dd>
		<dt><code>colgroup</code></dt>
		<dd>The header cell applies to all cells in the current column group that do not already have a scope applied to them. This value is only allowed if the cell is in a column group.</dd>
		<dt><code>row</code></dt>
		<dd>The header cell applies to the following cells in the same row (or rows, if <code>rowspan</code> is used as well), until either the end of the row or another <code>&lt;th&gt;</code> in the same row establishes a new scope.</dd>
		<dt><code>rowgroup</code></dt>
		<dd>The header cell applies to all cells in the current row group that do not already have a scope applied to them. This value is only allowed if the cell is in a row group.</dd>
		<dt>The empty string (<code>""</code>)</dt>
		<dd>The header cell has no predefined scope; the user agent will establish the scope based on contextual clues.</dd>
	</dl>
	

#### **Type**: `null`
