# HTMLSlotElement

<div class='overview'>The <strong><code>HTMLSlotElement</code></strong> interface of the <a href="/en-US/docs/Web/Web_Components/Shadow_DOM">Shadow DOM API</a> enables access to the name and assigned nodes of an HTML <a href="/en-US/docs/Web/HTML/Element/slot" title="The HTML <slot> element—part of the Web Components technology suite—is a placeholder inside a web component that you can fill with your own markup, which lets you create separate DOM trees and present them together."><code>&lt;slot&gt;</code></a> element.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">name</a>
    <div><a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a>: Can be used to get and set the slot's name.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">assignedElements()</a>
    <div>Returns a sequence of the elements assigned to this slot (and no other nodes). If the <code>flatten</code> option is set to <code>true</code>, it also returns the assigned elements of any other slots that are descendants of this slot. If no assigned nodes are found, it returns the slot's fallback content.</div>
  </li>
  <li>
    <a href="">assignedNodes()</a>
    <div>Returns a sequence of the nodes assigned to this slot, and if the <code>flatten</code> option is set to <code>true</code>, the assigned nodes of any other slots that are descendants of this slot. If no assigned nodes are found, it returns the slot's fallback content.</div>
  </li>
</ul>

## Events
