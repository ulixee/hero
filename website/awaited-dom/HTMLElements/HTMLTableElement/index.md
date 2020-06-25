# HTMLTableElement

<div class='overview'>The <strong><code>HTMLTableElement</code></strong> interface provides special properties and methods (beyond the regular <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> object interface it also has available to it by inheritance) for manipulating the layout and presentation of tables in an HTML document.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">align</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing an enumerated value reflecting the <code><a href="/en-US/docs/Web/HTML/Element/table#attr-align">align</a></code> attribute. It indicates the alignment of the element's contents with respect to the surrounding context. The possible values are <code>"left"</code>, <code>"right"</code>, and <code>"center"</code>.</div>
  </li>
  <li>
    <a href="">bgColor</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the background color of the cells. It reflects the obsolete <code><a href="/en-US/docs/Web/HTML/Element/table#attr-bgcolor">bgcolor</a></code> attribute.</div>
  </li>
  <li>
    <a href="">border</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the width in pixels of the border of the table. It reflects the obsolete <code><a href="/en-US/docs/Web/HTML/Element/table#attr-border">border</a></code> attribute.</div>
  </li>
  <li>
    <a href="">caption</a>
    <div>Is a&nbsp;<a href="/en-US/docs/Web/API/HTMLTableCaptionElement" title="The HTMLTableCaptionElement interface special properties (beyond the regular HTMLElement interface it also has available to it by inheritance) for manipulating table caption elements."><code>HTMLTableCaptionElement</code></a> representing the first <a href="/en-US/docs/Web/HTML/Element/caption" title="The HTML Table Caption element (<caption>) specifies the caption (or title) of a table, and if used is always the first child of a <table>."><code>&lt;caption&gt;</code></a> that is a child of the element, or <code>null</code> if none is found. When set, if the object doesn't represent a <code>&lt;caption&gt;</code>, a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with the <code>HierarchyRequestError</code> name is thrown. If a correct object is given, it is inserted in the tree as the first child of this element and the first <code>&lt;caption&gt;</code> that is a child of this element is removed from the tree, if any.</div>
  </li>
  <li>
    <a href="">cellPadding</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the width in pixels of the horizontal and vertical sapce between cell content and cell borders. It reflects the obsolete <code><a href="/en-US/docs/Web/HTML/Element/table#attr-cellpadding">cellpadding</a></code> attribute.</div>
  </li>
  <li>
    <a href="">cellSpacing</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the width in pixels of the horizontal and vertical separation between cells. It reflects the obsolete <code><a href="/en-US/docs/Web/HTML/Element/table#attr-cellspacing">cellspacing</a></code> attribute.</div>
  </li>
  <li>
    <a href="">frame</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the type of the external borders of the table. It reflects the obsolete <code><a href="/en-US/docs/Web/HTML/Element/table#attr-frame">frame</a></code> attribute and can take one of the following values: <code>"void"</code>, <code>"above"</code>, <code>"below"</code>, <code>"hsides"</code>, <code>"vsides"</code>, <code>"lhs"</code>, <code>"rhs"</code>, <code>"box"</code>, or <code>"border"</code>.</div>
  </li>
  <li>
    <a href="">rows</a>
    <div>Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> containing all the rows of the element, that is all <a href="/en-US/docs/Web/HTML/Element/tr" title="The HTML <tr> element defines a row of cells in a table. The row's cells can then be established using a mix of <td> (data cell) and <th> (header cell) elements."><code>&lt;tr&gt;</code></a> that are a child of the element, or a child or one of its <a href="/en-US/docs/Web/HTML/Element/thead" title="The HTML <thead> element defines a set of rows defining the head of the columns of the table."><code>&lt;thead&gt;</code></a>, <a href="/en-US/docs/Web/HTML/Element/tbody" title="The HTML Table Body element (<tbody>) encapsulates a set of table rows (<tr> elements), indicating that they comprise the body of the table (<table>)."><code>&lt;tbody&gt;</code></a> and <a href="/en-US/docs/Web/HTML/Element/tfoot" title="The HTML <tfoot> element defines a set of rows summarizing the columns of the table."><code>&lt;tfoot&gt;</code></a> children. The rows members of a <code>&lt;thead&gt;</code> appear first, in tree order, and those members of a <code>&lt;tbody&gt;</code> last, also in tree order. The <code>HTMLCollection</code> is live and is automatically updated when the <code>HTMLTableElement</code> changes.</div>
  </li>
  <li>
    <a href="">rules</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the type of the internal borders of the table. It reflects the obsolete <code><a href="/en-US/docs/Web/HTML/Element/table#attr-rules">rules</a></code> attribute and can take one of the following values: <code>"none"</code>, <code>"groups"</code>, <code>"rows"</code>, <code>"cols"</code>, or <code>"all"</code>.</div>
  </li>
  <li>
    <a href="">summary</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing a description of the purpose or the structure of the table. It reflects the obsolete <code><a href="/en-US/docs/Web/HTML/Element/table#attr-summary">summary</a></code> attribute.</div>
  </li>
  <li>
    <a href="">tBodies</a>
    <div>Returns a live <a href="/en-US/docs/Web/API/HTMLCollection" title="The HTMLCollection interface represents a generic collection (array-like object similar to arguments) of elements (in document order) and offers methods and properties for selecting from the list."><code>HTMLCollection</code></a> containing all the <a href="/en-US/docs/Web/HTML/Element/tbody" title="The HTML Table Body element (<tbody>) encapsulates a set of table rows (<tr> elements), indicating that they comprise the body of the table (<table>)."><code>&lt;tbody&gt;</code></a> of the element. The <code>HTMLCollection</code> is live and is automatically updated when the <code>HTMLTableElement</code> changes.</div>
  </li>
  <li>
    <a href="">tFoot</a>
    <div>Is a&nbsp;<a href="/en-US/docs/Web/API/HTMLTableSectionElement" title="The HTMLTableSectionElement interface provides special properties and methods (beyond the HTMLElement interface it also has available to it by inheritance) for manipulating the layout and presentation of sections, that is headers, footers and bodies, in an HTML table."><code>HTMLTableSectionElement</code></a> representing the first <a href="/en-US/docs/Web/HTML/Element/tfoot" title="The HTML <tfoot> element defines a set of rows summarizing the columns of the table."><code>&lt;tfoot&gt;</code></a> that is a child of the element, or <code>null</code> if none is found. When set, if the object doesn't represent a <code>&lt;tfoot&gt;</code>, a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with the <code>HierarchyRequestError</code> name is thrown. If a correct object is given, it is inserted in the tree immediately before the first element that is neither a <a href="/en-US/docs/Web/HTML/Element/caption" title="The HTML Table Caption element (<caption>) specifies the caption (or title) of a table, and if used is always the first child of a <table>."><code>&lt;caption&gt;</code></a>, a <a href="/en-US/docs/Web/HTML/Element/colgroup" title="The HTML <colgroup> element defines a group of columns within a table."><code>&lt;colgroup&gt;</code></a>, nor a <a href="/en-US/docs/Web/HTML/Element/thead" title="The HTML <thead> element defines a set of rows defining the head of the columns of the table."><code>&lt;thead&gt;</code></a>, or as the last child if there is no such element, and the first <code>&lt;tfoot&gt;</code> that is a child of this element is removed from the tree, if any.</div>
  </li>
  <li>
    <a href="">tHead</a>
    <div>Is a&nbsp;<a href="/en-US/docs/Web/API/HTMLTableSectionElement" title="The HTMLTableSectionElement interface provides special properties and methods (beyond the HTMLElement interface it also has available to it by inheritance) for manipulating the layout and presentation of sections, that is headers, footers and bodies, in an HTML table."><code>HTMLTableSectionElement</code></a> representing the first <a href="/en-US/docs/Web/HTML/Element/thead" title="The HTML <thead> element defines a set of rows defining the head of the columns of the table."><code>&lt;thead&gt;</code></a> that is a child of the element, or <code>null</code> if none is found. When set, if the object doesn't represent a <code>&lt;thead&gt;</code>, a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with the <code>HierarchyRequestError</code> name is thrown. If a correct object is given, it is inserted in the tree immediately before the first element that is neither a <a href="/en-US/docs/Web/HTML/Element/caption" title="The HTML Table Caption element (<caption>) specifies the caption (or title) of a table, and if used is always the first child of a <table>."><code>&lt;caption&gt;</code></a>, nor a <a href="/en-US/docs/Web/HTML/Element/colgroup" title="The HTML <colgroup> element defines a group of columns within a table."><code>&lt;colgroup&gt;</code></a>, or as the last child if there is no such element, and the first <code>&lt;thead&gt;</code> that is a child of this element is removed from the tree, if any.</div>
  </li>
  <li>
    <a href="">width</a>
    <div>Is a <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> containing the length in pixels or in percentage of the desired width fo the entire table. It reflects the obsolete <code><a href="/en-US/docs/Web/HTML/Element/table#attr-width">width</a></code> attribute.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">createCaption()</a>
    <div>Returns an <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> representing the first <a href="/en-US/docs/Web/HTML/Element/caption" title="The HTML Table Caption element (<caption>) specifies the caption (or title) of a table, and if used is always the first child of a <table>."><code>&lt;caption&gt;</code></a> that is a child of the element. If none is found, a new one is created and inserted in the tree as the first child of the <a href="/en-US/docs/Web/HTML/Element/table" title="The HTML <table> element represents tabular data — that is, information presented in a two-dimensional table comprised of rows and columns of cells containing data."><code>&lt;table&gt;</code></a> element.</div>
  </li>
  <li>
    <a href="">createTBody()</a>
    <div>Creates a tbody element, inserts it into the table, and returns it.</div>
  </li>
  <li>
    <a href="">createTFoot()</a>
    <div>Returns an <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> representing the first <a href="/en-US/docs/Web/HTML/Element/tfoot" title="The HTML <tfoot> element defines a set of rows summarizing the columns of the table."><code>&lt;tfoot&gt;</code></a> that is a child of the element. If none is found, a new one is created and inserted in the tree immediately before the first element that is neither a <a href="/en-US/docs/Web/HTML/Element/caption" title="The HTML Table Caption element (<caption>) specifies the caption (or title) of a table, and if used is always the first child of a <table>."><code>&lt;caption&gt;</code></a>, a <a href="/en-US/docs/Web/HTML/Element/colgroup" title="The HTML <colgroup> element defines a group of columns within a table."><code>&lt;colgroup&gt;</code></a>, nor a <a href="/en-US/docs/Web/HTML/Element/thead" title="The HTML <thead> element defines a set of rows defining the head of the columns of the table."><code>&lt;thead&gt;</code></a>, or as the last child if there is no such element.</div>
  </li>
  <li>
    <a href="">createTHead()</a>
    <div>Returns an <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> representing the first <a href="/en-US/docs/Web/HTML/Element/thead" title="The HTML <thead> element defines a set of rows defining the head of the columns of the table."><code>&lt;thead&gt;</code></a> that is a child of the element. If none is found, a new one is created and inserted in the tree immediately before the first element that is neither a <a href="/en-US/docs/Web/HTML/Element/caption" title="The HTML Table Caption element (<caption>) specifies the caption (or title) of a table, and if used is always the first child of a <table>."><code>&lt;caption&gt;</code></a>, nor a <a href="/en-US/docs/Web/HTML/Element/colgroup" title="The HTML <colgroup> element defines a group of columns within a table."><code>&lt;colgroup&gt;</code></a>, or as the last child if there is no such element.</div>
  </li>
  <li>
    <a href="">deleteCaption()</a>
    <div>Removes the first <a href="/en-US/docs/Web/HTML/Element/caption" title="The HTML Table Caption element (<caption>) specifies the caption (or title) of a table, and if used is always the first child of a <table>."><code>&lt;caption&gt;</code></a> that is a child of the element.</div>
  </li>
  <li>
    <a href="">deleteRow()</a>
    <div>Removes the row corresponding to the <code>index</code> given in parameter. If the <code>index</code> value is <code>-1</code> the last row is removed; if it smaller than <code>-1</code> or greater than the amount of rows in the collection, a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with the value <code>IndexSizeError</code> is raised.</div>
  </li>
  <li>
    <a href="">deleteTFoot()</a>
    <div>Removes the first <a href="/en-US/docs/Web/HTML/Element/tfoot" title="The HTML <tfoot> element defines a set of rows summarizing the columns of the table."><code>&lt;tfoot&gt;</code></a> that is a child of the element.</div>
  </li>
  <li>
    <a href="">deleteTHead()</a>
    <div>Removes the first <a href="/en-US/docs/Web/HTML/Element/thead" title="The HTML <thead> element defines a set of rows defining the head of the columns of the table."><code>&lt;thead&gt;</code></a> that is a child of the element.</div>
  </li>
  <li>
    <a href="">insertRow()</a>
    <div>Returns an <a href="/en-US/docs/Web/API/HTMLTableRowElement" title="The HTMLTableRowElement interface provides special properties and methods (beyond the HTMLElement interface it also has available to it by inheritance) for manipulating the layout and presentation of rows in an HTML table."><code>HTMLTableRowElement</code></a> representing a new row of the table. It inserts it in the rows collection immediately before the <a href="/en-US/docs/Web/HTML/Element/tr" title="The HTML <tr> element defines a row of cells in a table. The row's cells can then be established using a mix of <td> (data cell) and <th> (header cell) elements."><code>&lt;tr&gt;</code></a> element at the given <code>index</code> position. If necessary a <a href="/en-US/docs/Web/HTML/Element/tbody" title="The HTML Table Body element (<tbody>) encapsulates a set of table rows (<tr> elements), indicating that they comprise the body of the table (<table>)."><code>&lt;tbody&gt;</code></a> is created. If the <code>index</code> is <code>-1</code>, the new row is appended to the collection. If the <code>index</code> is smaller than <code>-1</code> or greater than the number of rows in the collection, a <a href="/en-US/docs/Web/API/DOMException" title="The DOMException interface represents an abnormal event (called an exception) which occurs as a result of calling a method or accessing a property of a web API."><code>DOMException</code></a> with the value <code>IndexSizeError</code> is raised.</div>
  </li>
</ul>

## Events
