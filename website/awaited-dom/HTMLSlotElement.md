# HTMLSlotElement

<div class='overview'>The <strong><code>HTMLSlotElement</code></strong> interface of the <a href="/en-US/docs/Web/Web_Components/Shadow_DOM">Shadow DOM API</a> enables access to the name and assigned nodes of an HTML <a href="/en-US/docs/Web/HTML/Element/slot" title="The HTML <slot> element—part of the Web Components technology suite—is a placeholder inside a web component that you can fill with your own markup, which lets you create separate DOM trees and present them together."><code>&lt;slot&gt;</code></a> element.</div>

## Properties

### .name <div class="specs"><i>W3C</i></div> {#name}

<a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a>: Can be used to get and set the slot's name.

#### **Type**: `null`

## Methods

### .assignedElements*(...args)* <div class="specs"><i>W3C</i></div> {#assignedElements}

Returns a sequence of the elements assigned to this slot (and no other nodes). If the <code>flatten</code> option is set to <code>true</code>, it also returns the assigned elements of any other slots that are descendants of this slot. If no assigned nodes are found, it returns the slot's fallback content.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

### .assignedNodes*(...args)* <div class="specs"><i>W3C</i></div> {#assignedNodes}

Returns a sequence of the nodes assigned to this slot, and if the <code>flatten</code> option is set to <code>true</code>, the assigned nodes of any other slots that are descendants of this slot. If no assigned nodes are found, it returns the slot's fallback content.

#### **Arguments**:


 - none

#### **Returns**: `Promise<void>`

## Events
