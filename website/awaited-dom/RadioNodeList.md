# RadioNodeList

<div class='overview'>The <strong><code>RadioNodeList</code></strong> interface represents a collection of radio elements in a <a href="/en-US/docs/Web/HTML/Element/form" title="The HTML <form> element represents a document section containing interactive controls for submitting information."><code>&lt;form&gt;</code></a> or a <a href="/en-US/docs/Web/HTML/Element/fieldset" title="The HTML <fieldset> element is used to group several controls as well as labels (<label>) within a web form."><code>&lt;fieldset&gt;</code></a> element.</div>

## Properties

### .value <div class="specs"><i>W3C</i></div> {#value}

If the underlying element collection contains radio buttons, the <code>value</code> property represents the checked radio button. On retrieving the <code>value</code> property, the <code>value</code> of the currently <code>checked</code> radio button is returned as a string. If the collection does not contain any radio buttons or none of the radio buttons in the collection is in <code>checked</code> state, the empty string is returned. On setting the <code>value</code> property, the first radio button input element whose <code>value</code> property is equal to the new value will be set to <code>checked</code>.

#### **Type**: `SuperDocument`

## Methods

## Events
