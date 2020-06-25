# HTMLTextAreaElement

<div class='overview'>The <strong><code>HTMLTextAreaElement</code></strong> interface provides special properties and methods for manipulating the layout and presentation of <a href="/en-US/docs/Web/HTML/Element/textarea" title="The HTML <textarea> element represents a multi-line plain-text editing control, useful when you want to allow users to enter a sizeable amount of free-form text, for example a comment on a review or feedback form."><code>&lt;textarea&gt;</code></a> elements.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">autocomplete</a>
    <div></div>
  </li>
  <li>
    <a href="">autofocus</a>
    <div><code><em>boolean</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-autofocus">autofocus</a></code> attribute, indicating that the control should have input focus when the page loads</div>
  </li>
  <li>
    <a href="">cols</a>
    <div><code><em>unsigned long</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-cols">cols</a></code> attribute, indicating the visible width of the text area.</div>
  </li>
  <li>
    <a href="">defaultValue</a>
    <div><code><em>string</em>:</code> Returns / Sets the control's default value, which behaves like the <a href="/en-US/docs/Web/API/Node/textContent" title="The textContent property of the Node interface represents the text content of the node and its descendants."><code>Node.textContent</code></a> property.</div>
  </li>
  <li>
    <a href="">disabled</a>
    <div><code><em>boolean</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-disabled">disabled</a></code> attribute, indicating that the control is not available for interaction.</div>
  </li>
  <li>
    <a href="">form</a>
    <div><code><em>object</em>:</code> Returns a reference to the parent form element. If this element is not contained in a form element, it can be the <code><a href="/en-US/docs/Web/HTML/Element/form#attr-id">id</a></code> attribute of any <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code></a> element in the same document or the value <code>null</code>.</div>
  </li>
  <li>
    <a href="">inputMode</a>
    <div></div>
  </li>
  <li>
    <a href="">labels</a>
    <div><a href="/en-US/docs/Web/API/NodeList" title="NodeList objects are collections of nodes, usually returned by properties such as Node.childNodes and methods such as document.querySelectorAll()."><code>NodeList</code></a>: Returns a list of label elements associated with this select element.</div>
  </li>
  <li>
    <a href="">maxLength</a>
    <div><code><em>long</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-maxlength">maxlength</a></code> attribute, indicating the maximum number of characters the user can enter. This constraint is evaluated only when the value changes.</div>
  </li>
  <li>
    <a href="">minLength</a>
    <div><code><em>long</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-minlength">minlength</a></code> attribute, indicating the minimum number of characters the user can enter. This constraint is evaluated only when the value changes.</div>
  </li>
  <li>
    <a href="">name</a>
    <div><code><em>string</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-name">name</a></code> attribute, containing the name of the control.</div>
  </li>
  <li>
    <a href="">placeholder</a>
    <div><code><em>string</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-placeholder">placeholder</a></code> attribute, containing a hint to the user about what to enter in the control.</div>
  </li>
  <li>
    <a href="">readOnly</a>
    <div><code><em>boolean</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-readonly">readonly</a></code> attribute, indicating that the user cannot modify the value of the control.</div>
  </li>
  <li>
    <a href="">required</a>
    <div><code><em>boolean</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-required">required</a></code> attribute, indicating that the user must specify a value before submitting the form.</div>
  </li>
  <li>
    <a href="">rows</a>
    <div><code><em>unsigned long</em>:</code> Returns / Sets the element's <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-rows">rows</a></code> attribute, indicating the number of visible text lines for the control.</div>
  </li>
  <li>
    <a href="">selectionDirection</a>
    <div><code><em>string</em>:</code> Returns / Sets the direction in which selection occurred. This is <code>"forward"</code> if selection was performed in the start-to-end direction of the current locale, or <code>"backward"</code> for the opposite direction. This can also be <code>"none"</code> if the direction is unknown."</div>
  </li>
  <li>
    <a href="">selectionEnd</a>
    <div><code><em>unsigned long</em>:</code> Returns / Sets the index of the end of selected text. If no text is selected, contains the index of the character that follows the input cursor. On being set, the control behaves as if <code>setSelectionRange()</code> had been called with this as the second argument, and <code>selectionStart</code> as the first argument.</div>
  </li>
  <li>
    <a href="">selectionStart</a>
    <div><code><em>unsigned long</em>:</code> Returns / Sets the index of the beginning of selected text. If no text is selected, contains the index of the character that follows the input cursor. On being set, the control behaves as if <code>setSelectionRange()</code> had been called with this as the first argument, and <code>selectionEnd</code> as the second argument.</div>
  </li>
  <li>
    <a href="">textLength</a>
    <div><code><em>long</em>:</code> Returns the codepoint length of the control's <code>value</code>. Same as <code>calling value.length</code></div>
  </li>
  <li>
    <a href="">type</a>
    <div><code><em>string</em>:</code> Returns the string <code>textarea</code>.</div>
  </li>
  <li>
    <a href="">validationMessage</a>
    <div><code><em>string</em>:</code> Returns a localized message that describes the validation constraints that the control does not satisfy (if any). This is the empty string if the control is not a candidate for constraint validation (<code>willValidate</code> is <code>false</code>), or it satisfies its constraints.</div>
  </li>
  <li>
    <a href="">validity</a>
    <div><code><em><a href="/en-US/docs/Web/API/ValidityState" title="The ValidityState interface represents the validity states that an element can be in, with respect to constraint validation. Together, they help explain why an element's value fails to validate, if it's not valid."><code>ValidityState</code></a> object</em>:</code> Returns the validity states that this element is in.</div>
  </li>
  <li>
    <a href="">value</a>
    <div><code><em>string</em>:</code> Returns / Sets the raw value contained in the control.</div>
  </li>
  <li>
    <a href="">willValidate</a>
    <div><p><code><em>boolean</em>:</code> Returns whether the element is a candidate for constraint validation. <code>false</code> if any conditions bar it from constraint validation, including its <code>readOnly</code> or <code>disabled</code> property is <code>true</code>.</p></div>
  </li>
  <li>
    <a href="">wrap</a>
    <div><code><em>string</em>:</code> Returns / Sets the <code><a href="/en-US/docs/Web/HTML/Element/textarea#attr-wrap">wrap</a></code> HTML attribute, indicating how the control wraps text.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">checkValidity()</a>
    <div>Returns <code>false</code> if the button is a candidate for constraint validation, and it does not satisfy its constraints. In this case, it also fires a cancelable <code>invalid</code> event at the control. It returns <code>true</code> if the control is not a candidate for constraint validation, or if it satisfies its constraints.</div>
  </li>
  <li>
    <a href="">reportValidity()</a>
    <div><p>This method reports the problems with the constraints on the element, if any, to the user. If there are problems, it fires a cancelable <code>invalid</code> event at the element, and returns <code>false</code>; if there are no problems, it returns <code>true</code>.</p></div>
  </li>
  <li>
    <a href="">select()</a>
    <div>Selects the contents of the control.</div>
  </li>
  <li>
    <a href="">setCustomValidity()</a>
    <div>Sets a custom validity message for the element. If this message is not the empty string, then the element is suffering from a custom validity error, and does not validate.</div>
  </li>
  <li>
    <a href="">setRangeText()</a>
    <div>Replaces a range of text in the element with new text.</div>
  </li>
  <li>
    <a href="">setSelectionRange()</a>
    <div>Selects a range of text in the element (but does not focus it).</div>
  </li>
</ul>

## Events
